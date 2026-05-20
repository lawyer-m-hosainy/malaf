// helpers/test-helpers.js
const { expect } = require('@playwright/test');

// ─────────────────────────────────────────────
// بيانات وهمية لتسجيل مكتب محامي جديد
// ─────────────────────────────────────────────
function generateFakeOffice() {
  const ts = Date.now();
  return {
    name:       `مكتب الاختبار ${ts}`,
    email:      `test.office.${ts}@mailinator.com`,
    phone:      `0500000${String(ts).slice(-4)}`,
    password:   `Test@${ts}`,
    city:       'الرياض',
    licenseNo:  `LIC-${ts}`,
    lawyerName: `محامي الاختبار ${ts}`,
  };
}

// ─────────────────────────────────────────────
// أسئلة اختبار وكلاء الذكاء الاصطناعي
// ─────────────────────────────────────────────
const AI_TEST_QUESTIONS = [
  // أسئلة قانونية متوقع الإجابة عليها
  { q: 'ما هي إجراءات رفع دعوى مدنية في المملكة العربية السعودية؟', category: 'إجراءات قانونية', expectAnswer: true },
  { q: 'كيف أسجل عقد إيجار؟', category: 'عقود', expectAnswer: true },
  { q: 'ما هي حقوقي إذا أُفلست شركتي؟', category: 'إفلاس', expectAnswer: true },
  { q: 'ما مدة التقادم في القضايا التجارية؟', category: 'تقادم', expectAnswer: true },
  { q: 'كيف أرفع شكوى عمالية؟', category: 'عمالي', expectAnswer: true },

  // أسئلة خارج نطاق القانون - يجب أن يرفضها الوكيل أو يحول
  { q: 'ما هو أفضل مطعم في الرياض؟', category: 'خارج النطاق', expectAnswer: false },
  { q: 'كيف أطبخ الكبسة؟', category: 'خارج النطاق', expectAnswer: false },

  // أسئلة حافة (Edge cases)
  { q: '', category: 'حقل فارغ', expectAnswer: false },
  { q: '؟؟؟؟؟', category: 'رموز فقط', expectAnswer: false },
];

// ─────────────────────────────────────────────
// Helper: انتظار تحميل الصفحة بالكامل
// ─────────────────────────────────────────────
async function waitForPageReady(page, timeout = 15000) {
  await page.waitForLoadState('domcontentloaded', { timeout });
  await page.waitForLoadState('networkidle', { timeout }).catch(() => {});
}

// ─────────────────────────────────────────────
// Helper: تحقق من عدم وجود أخطاء console
// ─────────────────────────────────────────────
function attachConsoleMonitor(page, errors = []) {
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(`[Console Error] ${msg.text()}`);
    }
  });
  page.on('pageerror', err => {
    errors.push(`[Page Error] ${err.message}`);
  });
  return errors;
}

// ─────────────────────────────────────────────
// Helper: لقطة شاشة مع اسم وصفي
// ─────────────────────────────────────────────
async function screenshotStep(page, name) {
  const safeName = name.replace(/[^a-zA-Z0-9-_\u0600-\u06FF]/g, '_');
  await page.screenshot({
    path: `reports/artifacts/screenshots/${safeName}.png`,
    fullPage: true
  }).catch(() => {});
}

// ─────────────────────────────────────────────
// Helper: فحص رابط / صفحة لا تعيد 404 أو 500
// ─────────────────────────────────────────────
async function checkPageStatus(page, url) {
  const response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 })
    .catch(e => null);
  return response ? response.status() : 0;
}

// ─────────────────────────────────────────────
// Helper: فحص عرض نص في الصفحة
// ─────────────────────────────────────────────
async function assertVisible(page, selector, description) {
  const el = page.locator(selector).first();
  try {
    await el.waitFor({ state: 'visible', timeout: 8000 });
    return { ok: true, description };
  } catch {
    return { ok: false, description, error: `عنصر غير موجود: ${selector}` };
  }
}

// ─────────────────────────────────────────────
// Helper: قياس زمن استجابة الصفحة
// ─────────────────────────────────────────────
async function measureResponseTime(page, url) {
  const start = Date.now();
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
  return Date.now() - start;
}

module.exports = {
  generateFakeOffice,
  AI_TEST_QUESTIONS,
  waitForPageReady,
  attachConsoleMonitor,
  screenshotStep,
  checkPageStatus,
  assertVisible,
  measureResponseTime,
};
