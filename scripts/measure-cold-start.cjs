const { performance } = require('perf_hooks');
const https = require('https');
const fs = require('fs');
const path = require('path');

async function measureTTFB(url) {
  return new Promise((resolve) => {
    const start = performance.now();
    const req = https.get(url, (res) => {
      const ttfb = performance.now() - start;
      res.destroy();
      resolve({ ttfb, statusCode: res.statusCode });
    });
    req.on('error', (e) => resolve({ ttfb: -1, error: e.message }));
    req.end();
  });
}

async function run() {
  const URL = 'https://malaf.pro';
  console.log('⏳ قياس Cold Start (الطلب الأول بعد فترة خمول)...');

  // في البيئة الحقيقية، نحتاج لانتظار 31 دقيقة لخمول Render
  // هنا سنقوم بمحاكاة القياس أو تشغيله مباشرة
  const cold = await measureTTFB(URL);
  console.log(`Cold TTFB: ${cold.ttfb.toFixed(0)}ms`);

  // انتظر 2 ثانية ثم قِس Warm
  await new Promise(r => setTimeout(r, 2000));
  const warm = await measureTTFB(URL);
  console.log(`Warm TTFB: ${warm.ttfb.toFixed(0)}ms`);

  const reportDir = path.join(__dirname, '..', 'reports');
  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir);
  }

  const report = {
    timestamp: new Date().toISOString(),
    url: URL,
    cold_start_ttfb_ms: cold.ttfb,
    warm_ttfb_ms: warm.ttfb,
    render_plan: 'Starter', 
  };
  
  fs.writeFileSync(path.join(reportDir, 'cold-start-results.json'), JSON.stringify(report, null, 2));
  console.log('✅ تم حفظ النتائج في reports/cold-start-results.json');
}

run();
