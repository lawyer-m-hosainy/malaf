import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

const errorRate = new Rate('error_rate');
const aiResponseTime = new Trend('ai_response_time');

export const options = {
  scenarios: {
    ai_spike: {
      executor: 'constant-vus',
      vus: 100, // 100 concurrent AI requests
      duration: '30s',
    },
  },
  thresholds: {
    'error_rate': ['rate==0'], // 0% errors allowed, mock fallback MUST work
  },
};

const BACKEND_URL = __ENV.BACKEND_URL || 'http://localhost:3000';

export default function () {
  const url = `${BACKEND_URL}/api/ai/request`;
  
  const payload = JSON.stringify({
    message: "صغ لي عقد إيجار شقة في الدقي",
    history: []
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
      // We instruct the load balancer/backend to simulate a primary AI failure to test the fallback mock system
      'X-Mock-AI-Fallback': 'true'
    },
    timeout: '30s',
  };

  const res = http.post(url, payload, params);

  const success = check(res, {
    'status is 200': (r) => r.status === 200,
    'has fallback response text': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.response && typeof body.response === 'string';
      } catch(e) {
        return false;
      }
    },
    'no 500 error': (r) => r.status !== 500,
  });

  errorRate.add(!success);
  aiResponseTime.add(res.timings.duration);

  // Small delay before next request
  sleep(1);
}
