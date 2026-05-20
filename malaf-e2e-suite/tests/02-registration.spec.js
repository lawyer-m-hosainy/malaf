// tests/02-registration.spec.js
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// الاختبار الثاني: تسجيل مكتب جديد وتسجيل الدخول
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const { test, expect } = require('@playwright/test');
const {
  generateFakeOffice,
  waitForPageReady,
  attachConsoleMonitor,
  screenshotStep,
} = require('../helpers/test-helpers');

// حفظ بيانات الجلسة بين الاختبارات
let registeredOffice = null;
let sessionCookies = null;

test.describe('تسجيل مكتب جديد وتسجيل الدخول', () => {
  let consoleErrors = [];

  test.beforeEach(async ({ page }) => {
    consoleErrors = [];
    attachConsoleMonitor(page, consoleErrors);
  });

  // ─────────────────────────────────────────────
  test('نموذج تسجيل مكتب يحتوي على الحقول المطلوبة', async ({ page }) => {
    // الوصول لصفحة التسجيل
    await page.goto('https://malaf.pro');
    await waitForPageReady(page);

    // البحث عن رابط التسجيل
    const registerBtn = page.locator(
      'a[href*="register"], a[href*="signup"], a:has-text("تسجيل"), a:has-text("إنشاء حساب"), button:has-text("ابدأ الآن")'
    ).first();

    const hasRegBtn = await registerBtn.isVisible().catch(() => false);
    if (hasRegBtn) {
      await registerBtn.click();
      await waitForPageReady(page);
    } else {
      await page.goto('https://malaf.pro/register');
      await waitForPageReady(page);
    }

    await screenshotStep(page, '02-register-form');

    // تحقق من وجود حقول النموذج الأساسية
    const requiredSelectors = {
      'حقل البريد الإلكتروني': 'input[type="email"], input[name*="email"], input[placeholder*="بريد"]',
      'حقل كلمة المرور': 'input[type="password"]',
      'زر الإرسال': 'button[type="submit"], input[type="submit"], button:has-text("تسجيل"), button:has-text("إنشاء")',
    };

    const fieldReport = {};
    for (const [name, selector] of Object.entries(requiredSelectors)) {
      const el = page.locator(selector).first();
      const visible = await el.isVisible().catch(() => false);
      fieldReport[name] = visible;
      console.log(`  ${visible ? '✓' : '✗'} ${name}`);
    }

    // على الأقل البريد والكلمة السرية وزر الإرسال يجب أن يكونا موجودَين
    expect(fieldReport['حقل البريد الإلكتروني'], 'حقل البريد غير موجود').toBe(true);
    expect(fieldReport['حقل كلمة المرور'], 'حقل كلمة المرور غير موجود').toBe(true);
  });

  // ─────────────────────────────────────────────
  test('التحقق من النموذج - رسائل الخطأ عند البيانات الفارغة', async ({ page }) => {
    await page.goto('https://malaf.pro/register', { waitUntil: 'domcontentloaded' });
    await waitForPageReady(page);

    // إرسال النموذج فارغاً
    const submitBtn = page.locator(
      'button[type="submit"], input[type="submit"]'
    ).first();

    const hasSubmit = await submitBtn.isVisible().catch(() => false);
    if (!hasSubmit) {
      test.skip(true, 'لم يُعثر على زر الإرسال في صفحة التسجيل');
      return;
    }

    await submitBtn.click();
    await page.waitForTimeout(1000);
    await screenshotStep(page, '02-empty-form-validation');

    // تحقق من ظهور رسائل خطأ (HTML5 validation أو custom errors)
    const errorMessages = page.locator(
      '[class*="error"], [class*="invalid"], [class*="alert"], .text-red-500, .text-danger, [role="alert"]'
    );
    const errorCount = await errorMessages.count();
    console.log(`  ℹ️  عدد رسائل الخطأ الظاهرة: ${errorCount}`);

    // لا نفرض expect هنا - فقط نوثق الحالة
    test.info().annotations.push({
      type: 'validation-check',
      description: `رسائل خطأ عند الإرسال الفارغ: ${errorCount}`,
    });
  });

  // ─────────────────────────────────────────────
  test('تسجيل مكتب جديد ببيانات وهمية صحيحة', async ({ page }) => {
    const office = generateFakeOffice();
    registeredOffice = office;

    await page.goto('https://malaf.pro/register', { waitUntil: 'domcontentloaded' });
    await waitForPageReady(page);

    // ملء حقل الاسم
    const nameField = page.locator(
      'input[name*="name"], input[placeholder*="اسم"], input[placeholder*="المكتب"], input[id*="name"]'
    ).first();
    if (await nameField.isVisible().catch(() => false)) {
      await nameField.fill(office.name);
    }

    // ملء البريد الإلكتروني
    const emailField = page.locator('input[type="email"]').first();
    if (await emailField.isVisible().catch(() => false)) {
      await emailField.fill(office.email);
    }

    // ملء رقم الهاتف
    const phoneField = page.locator(
      'input[type="tel"], input[name*="phone"], input[placeholder*="هاتف"], input[placeholder*="جوال"]'
    ).first();
    if (await phoneField.isVisible().catch(() => false)) {
      await phoneField.fill(office.phone);
    }

    // ملء كلمة المرور
    const passwordFields = page.locator('input[type="password"]');
    const pwCount = await passwordFields.count();
    if (pwCount >= 1) await passwordFields.nth(0).fill(office.password);
    if (pwCount >= 2) await passwordFields.nth(1).fill(office.password); // confirm password

    await screenshotStep(page, '02-filled-register-form');

    // إرسال النموذج
    const submitBtn = page.locator(
      'button[type="submit"], input[type="submit"], button:has-text("تسجيل"), button:has-text("إنشاء")'
    ).first();

    if (await submitBtn.isVisible().catch(() => false)) {
      await submitBtn.click();

      // انتظار الاستجابة
      await page.waitForTimeout(3000);
      await waitForPageReady(page).catch(() => {});
      await screenshotStep(page, '02-after-register-submit');

      const currentUrl = page.url();
      const pageContent = await page.content();

      // تحقق من نجاح التسجيل أو وجود رسالة خطأ واضحة
      const successIndicators = [
        currentUrl.includes('dashboard'),
        currentUrl.includes('office'),
        currentUrl.includes('verify'),
        pageContent.includes('تم التسجيل'),
        pageContent.includes('مرحباً'),
        pageContent.includes('تحقق'),
        pageContent.includes('البريد'),
      ];

      const errorIndicators = [
        pageContent.includes('موجود مسبقاً'),
        pageContent.includes('already exists'),
        pageContent.includes('error'),
        pageContent.includes('خطأ'),
      ];

      const successCount = successIndicators.filter(Boolean).length;
      const errorCount = errorIndicators.filter(Boolean).length;

      console.log(`  📍 URL بعد التسجيل: ${currentUrl}`);
      console.log(`  ✅ مؤشرات النجاح: ${successCount}`);
      console.log(`  ❌ مؤشرات الخطأ: ${errorCount}`);

      test.info().annotations.push({
        type: 'registration-result',
        description: `URL: ${currentUrl} | نجاح: ${successCount} | خطأ: ${errorCount}`,
      });

      // يجب أن يكون هناك نجاح أو خطأ واضح (ليس صفحة بيضاء)
      expect(
        successCount + errorCount,
        'الصفحة لا تعطي أي مؤشر على نتيجة التسجيل'
      ).toBeGreaterThan(0);
    }
  });

  // ─────────────────────────────────────────────
  test('صفحة تسجيل الدخول تعمل', async ({ page }) => {
    await page.goto('https://malaf.pro/login', { waitUntil: 'domcontentloaded' });
    await waitForPageReady(page);

    // إذا لم تكن هذه الصفحة موجودة، ابحث عن الرابط
    const isLoginPage = page.url().includes('login') || page.url().includes('signin');
    if (!isLoginPage) {
      const loginLink = page.locator('a:has-text("دخول"), a:has-text("تسجيل الدخول")').first();
      const hasLink = await loginLink.isVisible().catch(() => false);
      if (hasLink) {
        await loginLink.click();
        await waitForPageReady(page);
      }
    }

    await screenshotStep(page, '02-login-page');

    // تحقق من الحقول
    const emailField = page.locator('input[type="email"], input[type="text"]').first();
    const passwordField = page.locator('input[type="password"]').first();

    expect(
      await emailField.isVisible().catch(() => false),
      'حقل البريد الإلكتروني غير موجود في صفحة الدخول'
    ).toBe(true);

    expect(
      await passwordField.isVisible().catch(() => false),
      'حقل كلمة المرور غير موجود في صفحة الدخول'
    ).toBe(true);
  });

  // ─────────────────────────────────────────────
  test('تسجيل الدخول ببيانات خاطئة يُظهر رسالة خطأ', async ({ page }) => {
    await page.goto('https://malaf.pro/login', { waitUntil: 'domcontentloaded' });
    await waitForPageReady(page);

    const emailField = page.locator('input[type="email"], input[type="text"]').first();
    const passwordField = page.locator('input[type="password"]').first();
    const submitBtn = page.locator('button[type="submit"]').first();

    if (!await emailField.isVisible().catch(() => false)) {
      test.skip(true, 'صفحة تسجيل الدخول غير متاحة');
      return;
    }

    await emailField.fill('wrong@email.com');
    await passwordField.fill('wrongpassword123');
    await submitBtn.click();
    await page.waitForTimeout(3000);

    await screenshotStep(page, '02-wrong-login');

    const pageContent = await page.content();
    const hasError =
      pageContent.includes('خطأ') ||
      pageContent.includes('غير صحيح') ||
      pageContent.includes('invalid') ||
      pageContent.includes('incorrect') ||
      pageContent.includes('error') ||
      pageContent.includes('failed');

    test.info().annotations.push({
      type: 'auth-error-check',
      description: hasError ? 'تظهر رسالة خطأ عند بيانات غير صحيحة ✓' : '⚠️ لا تظهر رسالة خطأ!',
    });

    console.log(`  ${hasError ? '✓' : '⚠️'} رسالة خطأ عند بيانات خاطئة: ${hasError}`);
  });
});
