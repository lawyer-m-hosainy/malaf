# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: 01-homepage.spec.js >> الصفحة الرئيسية والصفحات العامة >> قائمة التنقل الرئيسية موجودة وقابلة للنقر
- Location: tests\01-homepage.spec.js:50:3

# Error details

```
Error: لا توجد روابط تنقل في الصفحة

expect(received).toBeGreaterThan(expected)

Expected: > 0
Received:   0
```

# Page snapshot

```yaml
- generic [ref=e2]:
  - region "Notifications alt+T"
  - generic [ref=e4]:
    - img [ref=e5]
    - paragraph [ref=e7]: جاري تحميل الصفحة...
```

# Test source

```ts
  1   | // tests/01-homepage.spec.js
  2   | // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  3   | // الاختبار الأول: الصفحة الرئيسية والصفحات العامة
  4   | // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  5   | const { test, expect } = require('@playwright/test');
  6   | const {
  7   |   waitForPageReady,
  8   |   attachConsoleMonitor,
  9   |   screenshotStep,
  10  |   measureResponseTime,
  11  |   checkPageStatus,
  12  | } = require('../helpers/test-helpers');
  13  | 
  14  | test.describe('الصفحة الرئيسية والصفحات العامة', () => {
  15  |   let consoleErrors = [];
  16  | 
  17  |   test.beforeEach(async ({ page }) => {
  18  |     consoleErrors = [];
  19  |     attachConsoleMonitor(page, consoleErrors);
  20  |   });
  21  | 
  22  |   // ─────────────────────────────────────────────
  23  |   test('الصفحة الرئيسية تُحمَّل بنجاح', async ({ page }) => {
  24  |     const ms = await measureResponseTime(page, 'https://malaf.pro');
  25  |     await screenshotStep(page, '01-homepage');
  26  | 
  27  |     // يجب أن تُحمَّل في أقل من 5 ثوان
  28  |     expect(ms, `وقت التحميل ${ms}ms — يجب أن يكون أقل من 5000ms`).toBeLessThan(5000);
  29  | 
  30  |     // عنوان الصفحة غير فارغ
  31  |     const title = await page.title();
  32  |     expect(title.length, 'عنوان الصفحة فارغ').toBeGreaterThan(0);
  33  | 
  34  |     // لا يوجد خطأ 404 أو 500
  35  |     const status = await page.evaluate(() => window.__pageStatus || 200);
  36  |     expect(status).not.toBe(404);
  37  | 
  38  |     // تحقق من وجود أخطاء JS
  39  |     if (consoleErrors.length > 0) {
  40  |       console.warn('⚠️  أخطاء Console في الصفحة الرئيسية:', consoleErrors.slice(0, 3));
  41  |     }
  42  | 
  43  |     test.info().annotations.push({
  44  |       type: 'performance',
  45  |       description: `وقت التحميل: ${ms}ms — عنوان: ${title}`,
  46  |     });
  47  |   });
  48  | 
  49  |   // ─────────────────────────────────────────────
  50  |   test('قائمة التنقل الرئيسية موجودة وقابلة للنقر', async ({ page }) => {
  51  |     await page.goto('https://malaf.pro');
  52  |     await waitForPageReady(page);
  53  | 
  54  |     // البحث عن روابط التنقل الرئيسية (navbar / header links)
  55  |     const navLinks = page.locator('nav a, header a, [role="navigation"] a');
  56  |     const count = await navLinks.count();
  57  | 
> 58  |     expect(count, 'لا توجد روابط تنقل في الصفحة').toBeGreaterThan(0);
      |                                                   ^ Error: لا توجد روابط تنقل في الصفحة
  59  |     console.log(`  ℹ️  عدد روابط التنقل: ${count}`);
  60  | 
  61  |     // تحقق من أن كل رابط له href
  62  |     for (let i = 0; i < Math.min(count, 10); i++) {
  63  |       const href = await navLinks.nth(i).getAttribute('href');
  64  |       const text = await navLinks.nth(i).innerText().catch(() => '');
  65  |       if (href && text.trim()) {
  66  |         console.log(`    ✓ ${text.trim()} → ${href}`);
  67  |       }
  68  |     }
  69  |   });
  70  | 
  71  |   // ─────────────────────────────────────────────
  72  |   test('صفحة تسجيل الدخول موجودة', async ({ page }) => {
  73  |     // محاولة أشكال مختلفة للرابط
  74  |     const loginUrls = [
  75  |       'https://malaf.pro/login',
  76  |       'https://malaf.pro/signin',
  77  |       'https://malaf.pro/auth/login',
  78  |       'https://malaf.pro/office/login',
  79  |     ];
  80  | 
  81  |     let loginFound = false;
  82  |     let foundUrl = '';
  83  | 
  84  |     for (const url of loginUrls) {
  85  |       const status = await checkPageStatus(page, url);
  86  |       if (status === 200) {
  87  |         loginFound = true;
  88  |         foundUrl = url;
  89  |         break;
  90  |       }
  91  |     }
  92  | 
  93  |     // البحث في الصفحة الرئيسية عن رابط تسجيل الدخول
  94  |     if (!loginFound) {
  95  |       await page.goto('https://malaf.pro');
  96  |       await waitForPageReady(page);
  97  |       const loginLink = page.locator(
  98  |         'a[href*="login"], a[href*="signin"], button:has-text("تسجيل"), a:has-text("دخول")'
  99  |       ).first();
  100 |       loginFound = await loginLink.isVisible().catch(() => false);
  101 |       if (loginFound) foundUrl = await loginLink.getAttribute('href') || 'زر في الصفحة';
  102 |     }
  103 | 
  104 |     expect(loginFound, 'لا يوجد رابط أو صفحة تسجيل دخول').toBe(true);
  105 |     console.log(`  ✓ رابط تسجيل الدخول: ${foundUrl}`);
  106 |     await screenshotStep(page, '01-login-page');
  107 |   });
  108 | 
  109 |   // ─────────────────────────────────────────────
  110 |   test('صفحة تسجيل مكتب جديد موجودة', async ({ page }) => {
  111 |     const registerUrls = [
  112 |       'https://malaf.pro/register',
  113 |       'https://malaf.pro/signup',
  114 |       'https://malaf.pro/auth/register',
  115 |       'https://malaf.pro/office/register',
  116 |       'https://malaf.pro/create-office',
  117 |     ];
  118 | 
  119 |     let registerFound = false;
  120 |     let foundUrl = '';
  121 | 
  122 |     for (const url of registerUrls) {
  123 |       const status = await checkPageStatus(page, url);
  124 |       if (status === 200) {
  125 |         registerFound = true;
  126 |         foundUrl = url;
  127 |         break;
  128 |       }
  129 |     }
  130 | 
  131 |     if (!registerFound) {
  132 |       await page.goto('https://malaf.pro');
  133 |       await waitForPageReady(page);
  134 |       const regLink = page.locator(
  135 |         'a[href*="register"], a[href*="signup"], a:has-text("تسجيل"), button:has-text("ابدأ")'
  136 |       ).first();
  137 |       registerFound = await regLink.isVisible().catch(() => false);
  138 |       if (registerFound) foundUrl = await regLink.getAttribute('href') || 'زر في الصفحة';
  139 |     }
  140 | 
  141 |     expect(registerFound, 'لا توجد صفحة أو رابط تسجيل مكتب جديد').toBe(true);
  142 |     console.log(`  ✓ رابط التسجيل: ${foundUrl}`);
  143 |     await screenshotStep(page, '01-register-page');
  144 |   });
  145 | 
  146 |   // ─────────────────────────────────────────────
  147 |   test('الصفحة متوافقة مع الجوال (responsive)', async ({ page }) => {
  148 |     await page.setViewportSize({ width: 375, height: 812 }); // iPhone 13
  149 |     await page.goto('https://malaf.pro');
  150 |     await waitForPageReady(page);
  151 |     await screenshotStep(page, '01-mobile-view');
  152 | 
  153 |     // تحقق من عدم وجود overflow أفقي
  154 |     const hasHorizontalScroll = await page.evaluate(() => {
  155 |       return document.body.scrollWidth > window.innerWidth;
  156 |     });
  157 | 
  158 |     if (hasHorizontalScroll) {
```