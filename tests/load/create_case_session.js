import http from 'k6/http';
import { sleep, check } from 'k6';

export const options = {
  stages: [
    { duration: '2m', target: 50 },
    { duration: '5m', target: 50 },
    { duration: '2m', target: 200 },
    { duration: '2m', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'],
    http_req_failed: ['rate<0.001'],
  },
};

export default function () {
  const BASE_URL = 'https://malaf.pro/api';
  const params = {
    headers: {
      'Authorization': 'Bearer YOUR_JWT_TOKEN',
      'Content-Type': 'application/json',
    },
  };

  // 1. إنشاء قضية جديدة
  const casePayload = JSON.stringify({
    title: 'قضية تعويض مدني ' + Math.random().toString(36).substring(7),
    court: 'محكمة شمال القاهرة الابتدائية',
    type: 'مدني',
    clientId: 'C-123456789'
  });

  const caseRes = http.post(`${BASE_URL}/cases`, casePayload, params);
  const caseCreated = check(caseRes, {
    'case created status is 201': (r) => r.status === 201,
  });

  if (caseCreated) {
    const caseId = caseRes.json('id');
    sleep(3);

    // 2. إنشاء جلسة مرتبطة بالقضية
    const sessionPayload = JSON.stringify({
      caseId: caseId,
      date: '2026-07-15',
      time: '10:30',
      court: 'محكمة شمال القاهرة الابتدائية',
      notes: 'جلسة المرافعة الفتامية'
    });

    const sessionRes = http.post(`${BASE_URL}/sessions`, sessionPayload, params);
    check(sessionRes, {
      'session created status is 201': (r) => r.status === 201,
    });

    sleep(3);

    // 3. تنظيف البيانات بعد الاختبار
    const deleteRes = http.del(`${BASE_URL}/cases/${caseId}`, null, params);
    check(deleteRes, {
      'case deleted status is 200': (r) => r.status === 200 || r.status === 204,
    });
  }

  sleep(3);
}
