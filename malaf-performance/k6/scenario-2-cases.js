import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('error_rate');
const responseTime = new Trend('response_time');

export const options = {
  stages: [
    { duration: '30s', target: 100 }, // Ramp-up to 100 users
    { duration: '1m', target: 500 },  // Spike to 500 users (Peak Monday Morning)
    { duration: '3m', target: 500 },  // Hold at 500 users
    { duration: '30s', target: 0 },   // Ramp-down
  ],
  thresholds: {
    'response_time': ['p(95)<3000'], // 95% of responses must be under 3s
    'error_rate': ['rate<0.01'],     // Error rate must be less than 1%
  },
};

// Simulate Supabase environment variables
const SUPABASE_URL = __ENV.SUPABASE_URL || 'https://mock.supabase.co';
const SUPABASE_ANON_KEY = __ENV.SUPABASE_ANON_KEY || 'mock-anon-key';
// In a real test, we would have an array of JWTs representing users from different tenants
const MOCK_JWTS = [
  'jwt_tenant_1', 'jwt_tenant_2', 'jwt_tenant_3' // Mock data
];

export default function () {
  // Select a random user JWT to simulate multi-tenant load
  const token = MOCK_JWTS[Math.floor(Math.random() * MOCK_JWTS.length)];

  const url = `${SUPABASE_URL}/rest/v1/cases?select=*&status=eq.متداولة`;
  
  const params = {
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      // Force PostgREST to process RLS
      'Prefer': 'count=exact'
    },
  };

  const res = http.get(url, params);

  // Assertions
  const success = check(res, {
    'status is 200': (r) => r.status === 200,
    'has data array': (r) => {
      try {
        const body = JSON.parse(r.body);
        return Array.isArray(body);
      } catch (e) {
        return false;
      }
    },
    'response time < 3000ms': (r) => r.timings.duration < 3000,
  });

  errorRate.add(!success);
  responseTime.add(res.timings.duration);

  // Think time: simulating reading cases
  sleep(Math.random() * 2 + 1); 
}
