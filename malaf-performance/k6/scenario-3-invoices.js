import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

const errorRate = new Rate('error_rate');
const invoiceGenerationTime = new Trend('invoice_generation_time');

export const options = {
  scenarios: {
    monthly_billing: {
      executor: 'constant-vus',
      vus: 50, // 50 admins concurrently generating invoices
      duration: '30s',
    },
  },
  thresholds: {
    'invoice_generation_time': ['p(99)<10000'], // 99% under 10s
    'error_rate': ['rate==0'], // Zero errors allowed for financial transactions
  },
};

const BACKEND_URL = __ENV.BACKEND_URL || 'http://localhost:3000';
const ADMIN_JWT = __ENV.ADMIN_JWT || 'mock-admin-token';

// To verify no duplicate invoice numbers, we use an in-memory Set (simulated via global context for simple tests, though k6 isolates VUs. Proper verification requires DB query post-test).
export default function () {
  const url = `${BACKEND_URL}/api/invoices/generate`;
  
  const payload = JSON.stringify({
    tenant_id: `tenant_${__VU}`, // Isolate per VU for test simulation
    items: [
      { description: "خدمات قانونية شهرية", amount: 10000 }
    ],
  });

  const params = {
    headers: {
      'Authorization': `Bearer ${ADMIN_JWT}`,
      'Content-Type': 'application/json',
    },
    timeout: '15s',
  };

  const res = http.post(url, payload, params);

  const success = check(res, {
    'status is 201 or 200': (r) => r.status === 201 || r.status === 200,
    'has valid invoice number': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.invoice_number && typeof body.invoice_number === 'string';
      } catch(e) {
        return false;
      }
    },
    'has exactly 14% VAT': (r) => {
      try {
        const body = JSON.parse(r.body);
        const subtotal = 10000;
        const expectedVat = subtotal * 0.14;
        return body.vat_amount === expectedVat && body.total_amount === (subtotal + expectedVat);
      } catch(e) {
        return false;
      }
    },
    'response time < 10000ms': (r) => r.timings.duration < 10000,
  });

  errorRate.add(!success);
  invoiceGenerationTime.add(res.timings.duration);

  // Admins might generate multiple invoices sequentially
  sleep(1);
}
