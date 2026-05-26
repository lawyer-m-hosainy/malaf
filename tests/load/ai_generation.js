import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend } from 'k6/metrics';

// قياس ai_generation_time كـ custom Trend metric
const aiGenerationTime = new Trend('ai_generation_time');

export const options = {
  stages: [
    { duration: '1m', target: 10 }, 
    { duration: '3m', target: 20 }, 
    { duration: '1m', target: 0 },
  ],
  threshold: {
    'ai_generation_time': ['p(95)<15000'],
    'http_req_failed': ['rate<0.05'],
  },
};

export default function () {
  const url = 'https://malaf.pro/api/ai/generate';
  
  const payload = JSON.stringify({
    templateId: 'defense_memo',
    prompt: 'صياغة مذكرة دفاع في قضية تعويض مدني عن حادث سيارة، مع الدفع بانتفاء الركن المادي للخطأ وقوة القهر.',
    context: {
      court: 'محكمة استئناف القاهرة',
      caseYear: '2026'
    }
  });

  const params = {
    headers: {
      'Authorization': 'Bearer YOUR_JWT_TOKEN',
      'Content-Type': 'application/json',
    },
    timeout: '30000ms',
  };

  const res = http.post(url, payload, params);

  aiGenerationTime.add(res.timings.duration);

  check(res, {
    'status is 200': (r) => r.status === 200,
    'content is complete': (r) => {
      const body = r.json();
      return body && body.text && body.text.length > 100;
    },
  });

  sleep(5);
}
