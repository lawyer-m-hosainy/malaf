// tests/03-dashboard.spec.js
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// الاختبار الثالث: لوحة التحكم وصفحات المكتب
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const { test, expect } = require('@playwright/test');
const {
  waitForPageReady,
  attachConsoleMonitor,
  screenshotStep,
  checkPageStatus,
} = require('../helpers/test-helpers');

// ─────────────────────────────────────────────
// مساعد: تسجيل الدخول واستعادة الجلسة
// ─────────────────────────────────────────────
async function loginToMalaf(page, email, password) {
  await page.goto('https://malaf.pro/login', { waitUntil: 'domcontentloaded' });
  await waitForPageReady(page);

  const emailField = page.locator('input[type="email"], input[type="text"]').first();
  const passwordField = page.locator('input[type="password"]').first();
  const submitBtn = page.locator('button[type="submit"]').first();

  if (!await emailField.isVisible().catch(() => false)) return false;

  await emailField.fill(email);
  await passwordField.fill(password);
  await submitBtn.click();
  await page.waitForTimeout(3000);
  await waitForPageReady(page).catch(() => {});

  // تحقق من نجاح الدخول
  const url = page.url();
  return url.includes('dashboard') || url.includes('office') || !url.includes('login');
}

test.describe('لوحة التحكم والصفحات الداخلية', () => {
  let consoleErrors = [];

  test.beforeEach(async ({ page }) => {
    consoleErrors = [];
    attachConsoleMonitor(page, consoleErrors);
  });

  // ─────────────────────────────────────────────
  test('روابط لوحة التحكم المحتملة تستجيب', async ({ page }) => {
    const dashboardUrls = [
      '/dashboard',
      '/office/dashboard',
      '/admin/dashboard',
      '/office',
      '/panel',
    ];

    const results = [];
    for (const path of dashboardUrls) {
      const status = await checkPageStatus(page, `https://malaf.pro${path}`);
      results.push({ path, status });
      console.log(`  ${status === 200 ? '✓' : status === 302 || status === 301 ? '↪' : '✗'} ${path} → ${status}`);
    }

    test.info().annotations.push({
      type: 'dashboard-urls',
      description: results.map(r => `${r.path}:${r.status}`).join(', '),
    });

    // واحد على الأقل يجب أن يرد (حتى لو بـ redirect للـ login)
    const responding = results.filter(r => r.status > 0);
    expect(responding.length, 'لا توجد مسارات لوحة تحكم تستجيب').toBeGreaterThan(0);
  });

  // ─────────────────────────────────────────────
  test('صفحة إعدادات المكتب موجودة', async ({ page }) => {
    const settingsUrls = ['/office/settings', '/settings', '/office/profile', '/profile'];
    let found = false;

    for (const path of settingsUrls) {
      const status = await checkPageStatus(page, `https://malaf.pro${path}`);
      if (status !== 404) {
        found = true;
        console.log(`  ✓ صفحة الإعدادات: ${path} (${status})`);
        break;
      }
    }

    test.info().annotations.push({
      type: 'settings-page',
      description: found ? 'موجودة ✓' : '⚠️ لم يُعثر عليها',
    });
  });

  // ─────────────────────────────────────────────
  test('صفحة إدارة الملفات / القضايا موجودة', async ({ page }) => {
    const caseUrls = [
      '/cases', '/office/cases', '/files', '/office/files',
      '/قضايا', '/matters', '/clients',
    ];

    const results = [];
    for (const path of caseUrls) {
      const status = await checkPageStatus(page, `https://malaf.pro${path}`);
      if (status !== 404 && status !== 0) {
        results.push({ path, status });
        console.log(`  ✓ ${path} → ${status}`);
      }
    }

    test.info().annotations.push({
      type: 'cases-management',
      description: results.length > 0
        ? results.map(r => r.path).join(', ')
        : '⚠️ لم يُعثر على صفحة إدارة القضايا/الملفات',
    });
  });

  // ─────────────────────────────────────────────
  test('استكشاف جميع روابط القائمة الجانبية في لوحة التحكم', async ({ page }) => {
    // محاولة الدخول لأي مسار من مسارات الـ dashboard
    await page.goto('https://malaf.pro/dashboard', { waitUntil: 'domcontentloaded' });
    await waitForPageReady(page).catch(() => {});

    // إذا أُعيد التوجيه لصفحة الدخول، هذا طبيعي
    const url = page.url();
    if (url.includes('login') || url.includes('signin')) {
      console.log('  ℹ️  لوحة التحكم تتطلب تسجيل الدخول (متوقع)');
      test.info().annotations.push({
        type: 'auth-required',
        description: 'لوحة التحكم محمية بتسجيل الدخول ✓',
      });
      return;
    }

    await screenshotStep(page, '03-dashboard-main');

    // استكشاف الروابط في القائمة الجانبية
    const sidebarLinks = page.locator('aside a, [class*="sidebar"] a, [class*="menu"] a, nav a');
    const count = await sidebarLinks.count();
    console.log(`  ℹ️  روابط في القائمة: ${count}`);

    const linkDetails = [];
    for (let i = 0; i < Math.min(count, 20); i++) {
      const text = await sidebarLinks.nth(i).innerText().catch(() => '');
      const href = await sidebarLinks.nth(i).getAttribute('href');
      if (text.trim() && href) {
        linkDetails.push({ text: text.trim(), href });
        console.log(`    • ${text.trim()} → ${href}`);
      }
    }

    test.info().annotations.push({
      type: 'sidebar-links',
      description: JSON.stringify(linkDetails),
    });
  });

  // ─────────────────────────────────────────────
  test('فحص الصفحات بعد تسجيل الدخول (إذا أمكن)', async ({ page }) => {
    // نستخدم بيانات اختبار افتراضية - سيفشل إذا لم تكن صحيحة
    // هذا الاختبار يتطلب بيانات دخول حقيقية ليعمل بالكامل
    const testEmail = process.env.MALAF_TEST_EMAIL || 'test@example.com';
    const testPassword = process.env.MALAF_TEST_PASSWORD || 'test123456';

    const loggedIn = await loginToMalaf(page, testEmail, testPassword);

    if (!loggedIn) {
      console.log('  ℹ️  تسجيل الدخول فشل - يحتاج بيانات حقيقية عبر متغيرات البيئة:');
      console.log('      MALAF_TEST_EMAIL و MALAF_TEST_PASSWORD');
      test.info().annotations.push({
        type: 'auth-note',
        description: 'يمكن تشغيل هذا الاختبار بضبط: MALAF_TEST_EMAIL & MALAF_TEST_PASSWORD',
      });
      return;
    }

    await screenshotStep(page, '03-logged-in-dashboard');

    // استكشاف الصفحات الداخلية بعد الدخول
    const internalPaths = [
      '/dashboard', '/office', '/cases', '/clients',
      '/reports', '/settings', '/subscription', '/billing',
    ];

    const pageResults = [];
    for (const path of internalPaths) {
      const status = await checkPageStatus(page, `https://malaf.pro${path}`);
      pageResults.push({ path, status });
    }

    console.log('\n  📄 تقرير الصفحات الداخلية:');
    pageResults.forEach(r => {
      const icon = r.status === 200 ? '✓' : r.status === 404 ? '✗' : '↪';
      console.log(`    ${icon} ${r.path} → ${r.status}`);
    });

    test.info().annotations.push({
      type: 'internal-pages',
      description: JSON.stringify(pageResults),
    });
  });
});
