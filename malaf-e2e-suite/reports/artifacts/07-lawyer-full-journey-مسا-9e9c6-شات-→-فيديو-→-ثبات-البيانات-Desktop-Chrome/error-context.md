# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: 07-lawyer-full-journey.spec.js >> مسار المحامي الكامل (حساب حقيقي) >> محامي: دخول → موكل → قضية → فريق → شات → فيديو → ثبات البيانات
- Location: tests\07-lawyer-full-journey.spec.js:28:3

# Error details

```
TimeoutError: page.waitForURL: Timeout 45000ms exceeded.
=========================== logs ===========================
waiting for navigation until "load"
============================================================
```

# Page snapshot

```yaml
- generic [ref=e2]:
  - region "Notifications alt+T"
  - generic [ref=e3]:
    - generic [ref=e4]:
      - img [ref=e7]
      - heading "مَلَف MALAF" [level=2] [ref=e11]
      - paragraph [ref=e12]: نظام حوكمة وإدارة المكاتب القانونية الذكي
    - generic [ref=e15]:
      - button "تسجيل الدخول باستخدام Google" [ref=e16]:
        - img
        - generic [ref=e17]: تسجيل الدخول باستخدام Google
      - generic [ref=e22]: أو تسجيل الدخول بالبريد الإلكتروني
      - generic [ref=e23]:
        - generic [ref=e24]:
          - generic [ref=e25]: البريد الإلكتروني
          - generic [ref=e26]:
            - img [ref=e27]
            - textbox "البريد الإلكتروني" [ref=e30]:
              - /placeholder: name@lawfirm.eg
              - text: m.hosainy.law@gmail.com
        - generic [ref=e31]:
          - generic [ref=e32]: كلمة المرور
          - generic [ref=e33]:
            - img [ref=e34]
            - textbox "كلمة المرور" [ref=e37]: 18620142032015Hos
            - button [ref=e38]:
              - img [ref=e39]
        - button "تسجيل الدخول" [ref=e42]:
          - img
          - text: تسجيل الدخول
      - button "ليس لديك حساب؟ إنشاء حساب جديد" [ref=e44]:
        - img
        - text: ليس لديك حساب؟ إنشاء حساب جديد
      - button "العودة للصفحة الرئيسية" [ref=e46]
```

# Test source

```ts
  1   | /**
  2   |  * مسار محامي كامل — يستخدم MALAF_TEST_EMAIL و MALAF_TEST_PASSWORD (لا تُحفظ في الملفات)
  3   |  */
  4   | const { test, expect } = require('@playwright/test');
  5   | const { waitForPageReady, attachConsoleMonitor } = require('../helpers/test-helpers');
  6   | 
  7   | const BASE = 'https://malaf.pro';
  8   | const EMAIL = process.env.MALAF_TEST_EMAIL;
  9   | const PASSWORD = process.env.MALAF_TEST_PASSWORD;
  10  | 
  11  | test.describe('مسار المحامي الكامل (حساب حقيقي)', () => {
  12  |   test.setTimeout(180000);
  13  | 
  14  |   test.beforeEach(() => {
  15  |     test.skip(!EMAIL || !PASSWORD, 'ضع MALAF_TEST_EMAIL و MALAF_TEST_PASSWORD');
  16  |   });
  17  | 
  18  |   async function login(page) {
  19  |     await page.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded' });
  20  |     await waitForPageReady(page);
  21  |     await page.locator('#login-email').fill(EMAIL);
  22  |     await page.locator('#password').fill(PASSWORD);
  23  |     await page.getByRole('button', { name: 'تسجيل الدخول', exact: true }).click();
> 24  |     await page.waitForURL(/\/dashboard/, { timeout: 45000 });
      |                ^ TimeoutError: page.waitForURL: Timeout 45000ms exceeded.
  25  |     await waitForPageReady(page);
  26  |   }
  27  | 
  28  |   test('محامي: دخول → موكل → قضية → فريق → شات → فيديو → ثبات البيانات', async ({ page }) => {
  29  |     const errors = [];
  30  |     attachConsoleMonitor(page, errors);
  31  | 
  32  |     const ts = Date.now();
  33  |     const clientName = `موكل تجربة ${ts}`;
  34  |     const nationalId = `2990101${String(ts).slice(-7)}`.slice(0, 14);
  35  |     const caseNumber = `88-${String(ts).slice(-4)}-ت`;
  36  |     const caseTitle = `دعوى تجريبية آلية ${ts}`;
  37  |     const teamName = `محامي مساعد ${ts}`;
  38  |     const teamEmail = `assistant.${ts}@mailinator.com`;
  39  |     const chatMessage = `رسالة اختبار من المحامي — ${ts}`;
  40  | 
  41  |     const results = { login: false, client: false, case: false, team: false, chat: false, video: false, persist: false };
  42  | 
  43  |     // ─── 1) تسجيل الدخول ───
  44  |     await login(page);
  45  |     results.login = true;
  46  |     await expect(page).toHaveURL(/\/dashboard/);
  47  | 
  48  |     // ─── 2) موكل ───
  49  |     await page.goto(`${BASE}/dashboard/clients`, { waitUntil: 'domcontentloaded' });
  50  |     await waitForPageReady(page);
  51  |     await page.getByTestId('add-client-btn').click();
  52  |     await page.getByTestId('client-name-input').fill(clientName);
  53  |     await page.getByTestId('client-national-id-input').fill(nationalId);
  54  |     await page.locator('#phone').fill('01012345678');
  55  |     await page.getByTestId('save-client-btn').click();
  56  |     await expect(page.getByText(clientName).first()).toBeVisible({ timeout: 20000 });
  57  |     results.client = true;
  58  | 
  59  |     // ─── 3) عضو فريق ───
  60  |     await page.goto(`${BASE}/dashboard/team`, { waitUntil: 'domcontentloaded' });
  61  |     await waitForPageReady(page);
  62  |     const addTeamBtn = page.getByRole('button', { name: 'إضافة عضو جديد' });
  63  |     if (await addTeamBtn.isVisible().catch(() => false)) {
  64  |       await addTeamBtn.click();
  65  |       await page.getByPlaceholder('اسم العضو').fill(teamName);
  66  |       await page.getByPlaceholder('example@lawfirm.eg').fill(teamEmail);
  67  |       await page.getByRole('button', { name: 'حفظ العضو' }).click();
  68  |       await expect(page.getByText(teamName).first()).toBeVisible({ timeout: 15000 });
  69  |       results.team = true;
  70  |     }
  71  | 
  72  |     // ─── 4) قضية ───
  73  |     await page.goto(`${BASE}/dashboard/cases`, { waitUntil: 'domcontentloaded' });
  74  |     await waitForPageReady(page);
  75  |     await page.getByTestId('add-case-btn').click();
  76  |     await page.getByTestId('client-select').selectOption({ label: new RegExp(clientName) });
  77  |     await page.locator('input[placeholder*="مثلاً"]').first().fill(caseNumber);
  78  |     await page.getByTestId('case-title-input').fill(caseTitle);
  79  |     await page.locator('select[title="نوع القضية"]').selectOption('مدني');
  80  |     await page.locator('select[title="تصنيف القضية"]').selectOption('جزئي');
  81  |     await page.locator('select[title="المحكمة"]').selectOption({ index: 1 });
  82  |     await page.locator('input[placeholder="أسماء الخصوم"]').fill('شركة الخصم للاختبار');
  83  |     await page.getByTestId('save-case-btn').click();
  84  |     await expect(
  85  |       page.getByText('تم إضافة القضية').or(page.getByText(caseNumber)).first()
  86  |     ).toBeVisible({ timeout: 25000 });
  87  |     results.case = true;
  88  | 
  89  |     // ─── 5) شات ───
  90  |     await page.goto(`${BASE}/dashboard/chat`, { waitUntil: 'domcontentloaded' });
  91  |     await waitForPageReady(page);
  92  |     const roomBtn = page.locator('[class*="cursor-pointer"], button, a').filter({ hasText: /عام|فريق|داخلي|محادثة/i }).first();
  93  |     if (await roomBtn.isVisible().catch(() => false)) {
  94  |       await roomBtn.click();
  95  |       await page.waitForTimeout(1500);
  96  |     }
  97  |     const chatInput = page.locator('textarea, input[placeholder*="راسل"]').first();
  98  |     if (await chatInput.isVisible().catch(() => false)) {
  99  |       await chatInput.fill(chatMessage);
  100 |       await page.keyboard.press('Enter');
  101 |       await page.waitForTimeout(2000);
  102 |       results.chat = await page.getByText(chatMessage).first().isVisible().catch(() => false);
  103 |     }
  104 | 
  105 |     // ─── 6) زر مكالمة فيديو (لا نبدأ مكالمة حقيقية — نتحقق من الزر فقط) ───
  106 |     const videoBtn = page.locator('button[title="مكالمة فيديو"], button:has(svg)').filter({ has: page.locator('svg') });
  107 |     const videoIcon = page.getByRole('button', { name: /فيديو|مكالمة/i }).or(page.locator('button[title="مكالمة فيديو"]'));
  108 |     results.video = await videoIcon.first().isVisible().catch(() => false);
  109 | 
  110 |     // ─── 7) إعادة تحميل — ثبات ───
  111 |     await page.goto(`${BASE}/dashboard/clients`, { waitUntil: 'domcontentloaded' });
  112 |     await waitForPageReady(page);
  113 |     const clientOk = await page.getByText(clientName).first().isVisible().catch(() => false);
  114 |     await page.goto(`${BASE}/dashboard/cases`, { waitUntil: 'domcontentloaded' });
  115 |     await waitForPageReady(page);
  116 |     const caseOk = await page.getByText(caseNumber).first().isVisible().catch(() => false);
  117 |     results.persist = clientOk && caseOk;
  118 | 
  119 |     console.log('\n📋 تقرير مسار المحامي:');
  120 |     console.log(JSON.stringify(results, null, 2));
  121 |     if (errors.length) console.log(`⚠️ console errors: ${errors.length}`);
  122 | 
  123 |     test.info().annotations.push({ type: 'lawyer-audit', description: JSON.stringify(results) });
  124 | 
```