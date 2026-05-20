#!/usr/bin/env node
// run-audit.js
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Super Script: تشغيل التدقيق الكامل لمنصة ملف
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// ─────────────────────────────────────────────
// ASCII Banner
// ─────────────────────────────────────────────
const banner = `
╔══════════════════════════════════════════════════════════╗
║                                                          ║
║    ███╗   ███╗ █████╗ ██╗      █████╗ ███████╗          ║
║    ████╗ ████║██╔══██╗██║     ██╔══██╗██╔════╝          ║
║    ██╔████╔██║███████║██║     ███████║█████╗            ║
║    ██║╚██╔╝██║██╔══██║██║     ██╔══██║██╔══╝            ║
║    ██║ ╚═╝ ██║██║  ██║███████╗██║  ██║██║               ║
║    ╚═╝     ╚═╝╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝╚═╝               ║
║                                                          ║
║    E2E Audit Suite — malaf.pro                           ║
║    وضع القراءة فقط | Read-Only Audit Mode               ║
║                                                          ║
╚══════════════════════════════════════════════════════════╝
`;

console.log(banner);

// ─────────────────────────────────────────────
// تحقق من وجود المتطلبات
// ─────────────────────────────────────────────
function checkRequirements() {
  console.log('🔍 فحص المتطلبات...\n');

  try {
    execSync('npx playwright --version', { stdio: 'pipe' });
    console.log('  ✅ Playwright متاح');
  } catch {
    console.log('  ⚠️  تثبيت Playwright...');
    execSync('npm install', { stdio: 'inherit' });
    execSync('npx playwright install chromium --with-deps', { stdio: 'inherit' });
  }

  fs.mkdirSync('reports/artifacts/screenshots', { recursive: true });
  console.log('  ✅ مجلدات التقارير جاهزة\n');
}

// ─────────────────────────────────────────────
// تشغيل الاختبارات
// ─────────────────────────────────────────────
function runTests() {
  console.log('🚀 بدء تشغيل الاختبارات...\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  return new Promise((resolve, reject) => {
    const args = [
      'playwright', 'test',
      '--reporter=list,./helpers/custom-reporter.js,html,json',
    ];

    // تشغيل اختبار واحد فقط إذا مُمرر كـ argument
    if (process.argv[2]) {
      args.push(`--grep=${process.argv[2]}`);
    }

    const proc = spawn('npx', args, {
      stdio: 'inherit',
      shell: true,
      env: {
        ...process.env,
        PLAYWRIGHT_HTML_REPORT: 'reports/html-report',
        PLAYWRIGHT_JSON_OUTPUT_NAME: 'reports/results.json',
      },
    });

    proc.on('close', code => {
      resolve(code);
    });

    proc.on('error', err => {
      reject(err);
    });
  });
}

// ─────────────────────────────────────────────
// عرض ملخص التقارير
// ─────────────────────────────────────────────
function showReportSummary() {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log('📁 ملفات التقارير المُنشأة:\n');

  const reportFiles = [
    { path: 'reports/AUDIT_REPORT.txt', name: 'التقرير النصي الكامل (عربي)' },
    { path: 'reports/full-audit.json', name: 'تقرير JSON التفصيلي' },
    { path: 'reports/results.json', name: 'نتائج Playwright JSON' },
    { path: 'reports/html-report/index.html', name: 'تقرير HTML التفاعلي' },
  ];

  reportFiles.forEach(({ path: filePath, name }) => {
    const exists = fs.existsSync(filePath);
    console.log(`  ${exists ? '✅' : '⬜'} ${name}`);
    if (exists) console.log(`     📄 ${path.resolve(filePath)}`);
  });

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log('💡 لعرض التقرير التفاعلي: npx playwright show-report reports/html-report');
  console.log('💡 لتشغيل اختبار بعينه: node run-audit.js "اسم الاختبار"');
  console.log('💡 لتشغيل مع بيانات دخول حقيقية:');
  console.log('     MALAF_TEST_EMAIL=your@email.com MALAF_TEST_PASSWORD=yourpwd node run-audit.js\n');
}

// ─────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────
async function main() {
  checkRequirements();

  const exitCode = await runTests().catch(err => {
    console.error('خطأ في تشغيل الاختبارات:', err);
    return 1;
  });

  showReportSummary();

  if (fs.existsSync('reports/AUDIT_REPORT.txt')) {
    const report = fs.readFileSync('reports/AUDIT_REPORT.txt', 'utf-8');
    console.log(report);
  }

  process.exit(exitCode);
}

main();
