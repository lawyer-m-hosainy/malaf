import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend } from 'k6/metrics';
import crypto from 'k6/crypto';

// المقياس المخصص لقياس وقت الرفع
const uploadTime = new Trend('upload_time');

// توليد بيانات ثنائية وهمية بحجم 1 ميجابايت
const binFile = crypto.randomBytes(1024 * 1024);

export const options = {
  stages: [
    { duration: '1m', target: 20 }, 
    { duration: '2m', target: 20 }, 
    { duration: '1m', target: 0 },
  ],
  thresholds: {
    'upload_time': ['p(95)<5000'],
    'http_req_failed': ['rate<0.01'],
  },
};

export default function () {
  const url = 'https://malaf.pro/api/documents/upload';
  
  const data = {
    file: http.file(binFile, 'legal_document.pdf', 'application/pdf'),
    caseId: 'C-LOAD-TEST-999',
    documentType: 'مستند تجريبي'
  };

  const params = {
    headers: {
      'Authorization': 'Bearer YOUR_JWT_TOKEN',
    },
  };

  const res = http.post(url, data, params);

  uploadTime.add(res.timings.duration);

  check(res, {
    'upload status is 200': (r) => r.status === 200,
    'has fileUrl in response': (r) => r.json('fileUrl') !== undefined,
  });

  sleep(2);
}
