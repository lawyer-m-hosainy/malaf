import http from 'k6/http';
import { sleep, check } from 'k6';

export const options = {
  stages: [
    { duration: '2m', target: 50 },  // رفع تدريجي لـ 50 مستخدم
    { duration: '5m', target: 50 },  // حمل ثابت لمدة 5 دقائق
    { duration: '2m', target: 200 }, // ذروة 200 مستخدم
    { duration: '2m', target: 0 },   // هبوط تدريجي
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% من الطلبات أقل من 500ms
    http_req_failed: ['rate<0.001'],   // نسبة الخطأ أقل من 0.1%
  },
};

export default function () {
  const loginUrl = 'https://malaf.pro/auth/token';
  const loginPayload = JSON.stringify({
    email: 'test@malaf.pro',
    password: 'password123',
  });
  const loginParams = {
    headers: { 'Content-Type': 'application/json' },
  };

  // 1. تسجيل الدخول والحصول على JWT
  const loginRes = http.post(loginUrl, loginPayload, loginParams);
  const token = loginRes.json('access_token');

  const authParams = {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  };

  sleep(2);

  // 2. جلب قائمة القضايا
  const listRes = http.get('https://malaf.pro/api/cases?page=1&limit=20', authParams);
  check(listRes, {
    'list status is 200': (r) => r.status === 200,
    'list response time < 500ms': (r) => r.timings.duration < 500,
  });

  sleep(2);

  // 3. البحث عن قضية (محمد)
  const searchRes = http.get('https://malaf.pro/api/cases?search=%D9%85%D8%AD%D9%85%D8%AF', authParams);
  check(searchRes, {
    'search status is 200': (r) => r.status === 200,
    'search response time < 500ms': (r) => r.timings.duration < 500,
  });

  sleep(2);
}
