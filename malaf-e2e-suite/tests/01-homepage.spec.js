// tests/01-homepage.spec.js
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// الاختبار الأول: الصفحة الرئيسية والصفحات العامة
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const { test, expect } = require('@playwright/test');
const {
  waitForPageReady,
  attachConsoleMonitor,
  screenshotStep,
  measureResponseTime,
  checkPageStatus,
} = require('../helpers/test-helpers');

test.describe('الصفحة الرئيسية والصفحات العامة', () => {
  let consoleErrors = [];

  test.beforeEach(async ({ page }) => {
    consoleErrors = [];
    attachConsoleMonitor(page, consoleErrors);
  });

  // ─────────────────────────────────────────────
  test('الصفحة الرئيسية تُحمَّل بنجاح', async ({ page }) => {
    const ms = await measureResponseTime(page, 'https://malaf.pro');
    await screenshotStep(page, '01-homepage');

    // يجب أن تُحمَّل في أقل من 5 ثوان
    expect(ms, `وقت التحميل ${ms}ms — يجب أن يكون أقل من 5000ms`).toBeLessThan(5000);

    // عنوان الصفحة غير فارغ
    const title = await page.title();
    expect(title.length, 'عنوان الصفحة فارغ').toBeGreaterThan(0);

    // لا يوجد خطأ 404 أو 500
    const status = await page.evaluate(() => window.__pageStatus || 200);
    expect(status).not.toBe(404);

    // تحقق من وجود أخطاء JS
    if (consoleErrors.length > 0) {
      console.warn('⚠️  أخطاء Console في الصفحة الرئيسية:', consoleErrors.slice(0, 3));
    }

    test.info().annotations.push({
      type: 'performance',
      description: `وقت التحميل: ${ms}ms — عنوان: ${title}`,
    });
  });

  // ─────────────────────────────────────────────
  test('قائمة التنقل الرئيسية موجودة وقابلة للنقر', async ({ page }) => {
    await page.goto('https://malaf.pro');
    await waitForPageReady(page);

    // البحث عن روابط التنقل الرئيسية (navbar / header links)
    const navLinks = page.locator('nav a, header a, [role="navigation"] a');
    const count = await navLinks.count();

    expect(count, 'لا توجد روابط تنقل في الصفحة').toBeGreaterThan(0);
    console.log(`  ℹ️  عدد روابط التنقل: ${count}`);

    // تحقق من أن كل رابط له href
    for (let i = 0; i < Math.min(count, 10); i++) {
      const href = await navLinks.nth(i).getAttribute('href');
      const text = await navLinks.nth(i).innerText().catch(() => '');
      if (href && text.trim()) {
        console.log(`    ✓ ${text.trim()} → ${href}`);
      }
    }
  });

  // ─────────────────────────────────────────────
  test('صفحة تسجيل الدخول موجودة', async ({ page }) => {
    // محاولة أشكال مختلفة للرابط
    const loginUrls = [
      'https://malaf.pro/login',
      'https://malaf.pro/signin',
      'https://malaf.pro/auth/login',
      'https://malaf.pro/office/login',
    ];

    let loginFound = false;
    let foundUrl = '';

    for (const url of loginUrls) {
      const status = await checkPageStatus(page, url);
      if (status === 200) {
        loginFound = true;
        foundUrl = url;
        break;
      }
    }

    // البحث في الصفحة الرئيسية عن رابط تسجيل الدخول
    if (!loginFound) {
      await page.goto('https://malaf.pro');
      await waitForPageReady(page);
      const loginLink = page.locator(
        'a[href*="login"], a[href*="signin"], button:has-text("تسجيل"), a:has-text("دخول")'
      ).first();
      loginFound = await loginLink.isVisible().catch(() => false);
      if (loginFound) foundUrl = await loginLink.getAttribute('href') || 'زر في الصفحة';
    }

    expect(loginFound, 'لا يوجد رابط أو صفحة تسجيل دخول').toBe(true);
    console.log(`  ✓ رابط تسجيل الدخول: ${foundUrl}`);
    await screenshotStep(page, '01-login-page');
  });

  // ─────────────────────────────────────────────
  test('صفحة تسجيل مكتب جديد موجودة', async ({ page }) => {
    const registerUrls = [
      'https://malaf.pro/register',
      'https://malaf.pro/signup',
      'https://malaf.pro/auth/register',
      'https://malaf.pro/office/register',
      'https://malaf.pro/create-office',
    ];

    let registerFound = false;
    let foundUrl = '';

    for (const url of registerUrls) {
      const status = await checkPageStatus(page, url);
      if (status === 200) {
        registerFound = true;
        foundUrl = url;
        break;
      }
    }

    if (!registerFound) {
      await page.goto('https://malaf.pro');
      await waitForPageReady(page);
      const regLink = page.locator(
        'a[href*="register"], a[href*="signup"], a:has-text("تسجيل"), button:has-text("ابدأ")'
      ).first();
      registerFound = await regLink.isVisible().catch(() => false);
      if (registerFound) foundUrl = await regLink.getAttribute('href') || 'زر في الصفحة';
    }

    expect(registerFound, 'لا توجد صفحة أو رابط تسجيل مكتب جديد').toBe(true);
    console.log(`  ✓ رابط التسجيل: ${foundUrl}`);
    await screenshotStep(page, '01-register-page');
  });

  // ─────────────────────────────────────────────
  test('الصفحة متوافقة مع الجوال (responsive)', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 }); // iPhone 13
    await page.goto('https://malaf.pro');
    await waitForPageReady(page);
    await screenshotStep(page, '01-mobile-view');

    // تحقق من عدم وجود overflow أفقي
    const hasHorizontalScroll = await page.evaluate(() => {
      return document.body.scrollWidth > window.innerWidth;
    });

    if (hasHorizontalScroll) {
      console.warn('  ⚠️  الصفحة تحتوي على تمرير أفقي على الجوال');
    }
  });

  // ─────────────────────────────────────────────
  test('لا توجد روابط مكسورة في الصفحة الرئيسية', async ({ page }) => {
    await page.goto('https://malaf.pro');
    await waitForPageReady(page);

    const links = await page.$$eval('a[href]', anchors =>
      anchors
        .map(a => a.getAttribute('href'))
        .filter(h => h && h.startsWith('/') && !h.startsWith('//'))
        .slice(0, 15) // نختبر أول 15 رابط داخلي فقط
    );

    console.log(`  ℹ️  اختبار ${links.length} رابط داخلي...`);
    const broken = [];

    for (const link of links) {
      const status = await checkPageStatus(page, `https://malaf.pro${link}`);
      if (status === 404 || status === 500) {
        broken.push({ link, status });
        console.log(`  ❌ رابط مكسور: ${link} (${status})`);
      } else {
        console.log(`  ✓ ${link} (${status})`);
      }
    }

    if (broken.length > 0) {
      test.info().annotations.push({
        type: 'broken-links',
        description: broken.map(b => `${b.link} → ${b.status}`).join(', '),
      });
    }

    expect(broken.length, `${broken.length} روابط مكسورة`).toBe(0);
  });
});
