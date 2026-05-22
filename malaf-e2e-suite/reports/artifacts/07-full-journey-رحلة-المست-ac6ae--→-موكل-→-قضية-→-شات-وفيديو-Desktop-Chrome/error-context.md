# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: 07-full-journey.spec.js >> رحلة المستخدم الكاملة على malaf.pro >> تسجيل مكتب → موكل → قضية → شات وفيديو
- Location: tests\07-full-journey.spec.js:10:3

# Error details

```
TimeoutError: locator.click: Timeout 15000ms exceeded.
Call log:
  - waiting for getByTestId('add-client-btn')

```

# Page snapshot

```yaml
- generic [ref=e2]:
  - region "Notifications alt+T"
  - generic [ref=e4]:
    - generic [ref=e5]:
      - heading "مَلَف" [level=2] [ref=e6]
      - paragraph [ref=e7]: إنشاء حساب مكتب جديد
    - generic [ref=e8]:
      - img [ref=e11]
      - img [ref=e18]
      - img [ref=e24]
      - img [ref=e32]
    - generic [ref=e35]:
      - generic [ref=e37]:
        - img [ref=e38]
        - text: بيانات المكتب والمسؤول
      - generic [ref=e41]:
        - generic [ref=e42]:
          - generic [ref=e43]:
            - generic [ref=e44]:
              - generic [ref=e45]:
                - img [ref=e46]
                - text: اسم المكتب / المنشأة *
              - textbox "اسم المكتب / المنشأة *" [ref=e50]:
                - /placeholder: مكتب الدكتور أحمد للمحاماة
                - text: محامي الاختبار 1779427119105
            - generic [ref=e51]:
              - generic [ref=e52]:
                - img [ref=e53]
                - text: اسم المسؤول *
              - textbox "اسم المسؤول *" [ref=e58]:
                - /placeholder: أحمد محمد
                - text: محامي الاختبار 1779427119105
          - generic [ref=e59]:
            - generic [ref=e60]:
              - img [ref=e61]
              - text: البريد الإلكتروني *
            - textbox "البريد الإلكتروني *" [ref=e64]:
              - /placeholder: admin@lawfirm.com
              - text: test.office.1779427119105@mailinator.com
          - generic [ref=e65]:
            - generic [ref=e66]:
              - generic [ref=e67]:
                - img [ref=e68]
                - text: كلمة المرور *
              - textbox "كلمة المرور *" [ref=e71]:
                - /placeholder: 8 أحرف على الأقل
            - generic [ref=e72]:
              - generic [ref=e73]:
                - img [ref=e74]
                - text: رقم الهاتف (اختياري)
              - textbox "رقم الهاتف (اختياري)" [ref=e76]:
                - /placeholder: "01234567890"
          - paragraph [ref=e77]:
            - img [ref=e78]
            - text: بياناتك مشفرة ومحمية بمعيار AES-256
        - generic [ref=e81]:
          - button "السابق" [disabled]:
            - img
            - text: السابق
          - button "التالي" [ref=e82]:
            - text: التالي
            - img
    - paragraph [ref=e83]:
      - text: لديك حساب بالفعل؟
      - button "تسجيل الدخول" [ref=e84]
```

# Test source

```ts
  1   | // رحلة كاملة: تسجيل → موكل → قضية → شات وفيديو
  2   | const { test, expect } = require('@playwright/test');
  3   | const { generateFakeOffice, waitForPageReady, screenshotStep } = require('../helpers/test-helpers');
  4   | 
  5   | const BASE = 'https://malaf.pro';
  6   | 
  7   | test.describe('رحلة المستخدم الكاملة على malaf.pro', () => {
  8   |   test.setTimeout(180000);
  9   | 
  10  |   test('تسجيل مكتب → موكل → قضية → شات وفيديو', async ({ page }) => {
  11  |     const office = generateFakeOffice();
  12  |     const ts = Date.now();
  13  |     const clientName = `موكل اختبار ${ts}`;
  14  |     const caseTitle = `قضية اختبار ${ts}`;
  15  |     const caseNumber = `99-${String(ts).slice(-4)}-ت`;
  16  |     const nationalId = `2${String(ts).padStart(13, '0').slice(0, 13)}`;
  17  |     const results = { register: null, client: null, case: null, chat: null, video: null };
  18  | 
  19  |     // ─── 1. تسجيل حساب جديد ───
  20  |     await page.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded' });
  21  |     await waitForPageReady(page);
  22  | 
  23  |     await page.getByRole('button', { name: /إنشاء حساب جديد/i }).click();
  24  |     await page.locator('#register-name').fill(office.lawyerName);
  25  |     await page.locator('#register-email').fill(office.email);
  26  |     await page.locator('#register-password').fill(office.password);
  27  |     await page.locator('#register-confirm').fill(office.password);
  28  |     await screenshotStep(page, '07-register-filled');
  29  | 
  30  |     await page.getByRole('button', { name: /إنشاء الحساب/i }).click();
  31  |     await page.waitForTimeout(5000);
  32  | 
  33  |     const urlAfterReg = page.url();
  34  |     const needsEmail = urlAfterReg.includes('/login');
  35  |     const loggedIn = urlAfterReg.includes('/dashboard') || urlAfterReg.includes('/onboarding');
  36  | 
  37  |     if (needsEmail && !loggedIn) {
  38  |       results.register = { ok: false, reason: 'يتطلب تفعيل البريد — لا يمكن إكمال الرحلة تلقائياً', email: office.email };
  39  |       console.log('⚠️ التسجيل يتطلب تفعيل البريد:', office.email);
  40  |       test.info().attach('credentials', { body: JSON.stringify(office, null, 2), contentType: 'application/json' });
  41  |       // محاولة تسجيل الدخول إن كان التفعيل معطلاً
  42  |       await page.locator('input[type="email"]').first().fill(office.email);
  43  |       await page.locator('input[type="password"]').first().fill(office.password);
  44  |       await page.getByRole('button', { name: 'تسجيل الدخول', exact: true }).click();
  45  |       await page.waitForTimeout(4000);
  46  |     }
  47  | 
  48  |     if (page.url().includes('/onboarding')) {
  49  |       await page.locator('#officeName, input[id="officeName"]').first().fill(office.name).catch(() => {});
  50  |       await page.locator('#adminName, input[id="adminName"]').first().fill(office.lawyerName).catch(() => {});
  51  |       for (let s = 0; s < 3; s++) {
  52  |         const next = page.getByRole('button', { name: /التالي/i });
  53  |         if (await next.isVisible().catch(() => false)) await next.click();
  54  |         await page.waitForTimeout(500);
  55  |       }
  56  |       const createBtn = page.getByRole('button', { name: /إنشاء المكتب/i });
  57  |       if (await createBtn.isVisible().catch(() => false)) {
  58  |         await createBtn.click();
  59  |         await page.waitForURL(/dashboard/, { timeout: 30000 }).catch(() => {});
  60  |       }
  61  |     }
  62  | 
  63  |     await waitForPageReady(page);
  64  |     await screenshotStep(page, '07-after-register');
  65  | 
  66  |     const onDashboard = page.url().includes('/dashboard');
  67  |     const onOnboarding = page.url().includes('/onboarding');
  68  |     results.register = {
  69  |       ok: onDashboard || onOnboarding,
  70  |       url: page.url(),
  71  |       email: office.email,
  72  |       password: office.password,
  73  |     };
  74  |     console.log('📋 تسجيل:', results.register);
  75  | 
  76  |     expect(results.register.ok, `فشل التسجيل — ${page.url()}`).toBe(true);
  77  | 
  78  |     // ─── 2. إضافة موكل ───
  79  |     await page.goto(`${BASE}/dashboard/clients`, { waitUntil: 'domcontentloaded' });
  80  |     await waitForPageReady(page);
> 81  |     await page.getByTestId('add-client-btn').click({ timeout: 15000 });
      |                                              ^ TimeoutError: locator.click: Timeout 15000ms exceeded.
  82  |     await page.getByTestId('client-name-input').fill(clientName);
  83  |     // رقم قومي مصري صالح: 14 رقم يبدأ بـ 2 أو 3
  84  |     await page.getByTestId('client-national-id-input').fill(nationalId);
  85  |     await page.getByPlaceholder(/رقم الهاتف المصري|01/i).fill(`010${String(ts).slice(-8)}`);
  86  |     await screenshotStep(page, '07-client-form');
  87  |     await page.getByTestId('save-client-btn').click();
  88  | 
  89  |     const successToast = page.getByText('تم إضافة العميل بنجاح');
  90  |     const errorToast = page.locator('[data-sonner-toast], [role="alert"]').filter({ hasText: /خطأ|فشل|مسجل|مكتب/i });
  91  |     await Promise.race([
  92  |       successToast.waitFor({ state: 'visible', timeout: 20000 }),
  93  |       errorToast.first().waitFor({ state: 'visible', timeout: 20000 }),
  94  |     ]).catch(() => {});
  95  | 
  96  |     const toastError = await errorToast.first().textContent().catch(() => null);
  97  |     await page.waitForTimeout(1500);
  98  |     await page.reload({ waitUntil: 'domcontentloaded' });
  99  |     await waitForPageReady(page);
  100 | 
  101 |     const clientVisible = await page.getByText(clientName).isVisible().catch(() => false);
  102 |     results.client = { ok: clientVisible, name: clientName, nationalId, toastError };
  103 |     console.log('👤 موكل:', results.client);
  104 |     if (!clientVisible) {
  105 |       console.log('⚠️ تخطي القضية — الموكل لم يُحفظ');
  106 |     }
  107 | 
  108 |     // ─── 3. إضافة قضية ───
  109 |     await page.goto(`${BASE}/dashboard/cases`, { waitUntil: 'domcontentloaded' });
  110 |     await waitForPageReady(page);
  111 |     await page.getByTestId('add-case-btn').click({ timeout: 15000 });
  112 | 
  113 |     const clientSelect = page.getByTestId('client-select');
  114 |     const optionCount = await clientSelect.locator('option').count();
  115 |     if (optionCount <= 1) {
  116 |       results.case = { ok: false, reason: 'لا يوجد موكل في القائمة — أضف موكلاً أولاً' };
  117 |       console.log('⚖️ قضية:', results.case);
  118 |     } else {
  119 |     await clientSelect.selectOption({ label: clientName }).catch(async () => {
  120 |       await clientSelect.selectOption({ index: 1 });
  121 |     });
  122 | 
  123 |     await page.locator('input[placeholder*="مثلاً: 45-123-ت"]').fill(caseNumber);
  124 |     await page.getByTestId('case-title-input').fill(caseTitle);
  125 | 
  126 |     // رقم التوكيل (إجباري)
  127 |     const poaNum = page.locator('input[placeholder="رقم"]').first();
  128 |     if (await poaNum.isVisible().catch(() => false)) {
  129 |       await poaNum.fill('1234');
  130 |       await page.locator('select[title="حرف التوكيل"]').selectOption('ب');
  131 |       await page.locator('input[placeholder="سنة"]').fill('2024');
  132 |     }
  133 | 
  134 |     const courtCat = page.locator('select[title="التصنيف الأساسي"]');
  135 |     if (await courtCat.isVisible().catch(() => false)) {
  136 |       await courtCat.selectOption({ label: 'تجاري' }).catch(() => courtCat.selectOption({ index: 1 }));
  137 |       await page.locator('select[title="نوع المحكمة"]').selectOption({ index: 1 }).catch(() => {});
  138 |       await page.locator('select[title="مقر المحكمة"]').selectOption({ index: 1 }).catch(() => {});
  139 |     }
  140 | 
  141 |     const roleSelect = page.locator('select[title="صفة الموكل"]');
  142 |     if (await roleSelect.isVisible().catch(() => false)) {
  143 |       await roleSelect.selectOption('مدعي');
  144 |     }
  145 |     await page.locator('input[placeholder="أسماء الخصوم"]').fill('شركة الخصم للاختبار').catch(() => {});
  146 | 
  147 |     await screenshotStep(page, '07-case-form');
  148 |     await page.getByTestId('save-case-btn').click();
  149 |     await page.waitForTimeout(4000);
  150 | 
  151 |     const caseVisible =
  152 |       (await page.getByText(caseNumber).isVisible().catch(() => false)) ||
  153 |       (await page.getByText(caseTitle).isVisible().catch(() => false)) ||
  154 |       (await page.locator('text=تم إضافة القضية').isVisible().catch(() => false));
  155 | 
  156 |     results.case = { ok: caseVisible, number: caseNumber, title: caseTitle };
  157 |     console.log('⚖️ قضية:', results.case);
  158 |     }
  159 | 
  160 |     // ─── 4. قسم الشات ───
  161 |     await page.goto(`${BASE}/dashboard/chat`, { waitUntil: 'domcontentloaded' });
  162 |     await waitForPageReady(page);
  163 |     await screenshotStep(page, '07-chat-page');
  164 | 
  165 |     const chatInput = page.locator('textarea, input[type="text"]').filter({ hasNot: page.locator('[type="search"]') }).first();
  166 |     const hasChatInput = await chatInput.isVisible().catch(() => false);
  167 |     const hasSidebar = await page.locator('[class*="sidebar"], aside, [class*="ChatSidebar"]').first().isVisible().catch(() => false);
  168 | 
  169 |     // إنشاء غرفة محادثة إن لم تكن موجودة
  170 |     const newRoomBtn = page.getByRole('button', { name: /غرفة|محادثة جديدة|إنشاء/i }).first();
  171 |     if (await newRoomBtn.isVisible().catch(() => false)) {
  172 |       await newRoomBtn.click();
  173 |       const roomNameInput = page.locator('input').filter({ hasNot: page.locator('[placeholder*="ابحث"]') }).first();
  174 |       if (await roomNameInput.isVisible().catch(() => false)) {
  175 |         await roomNameInput.fill(`غرفة اختبار ${ts}`);
  176 |         await page.getByRole('button', { name: /إنشاء|حفظ/i }).last().click().catch(() => {});
  177 |         await page.waitForTimeout(2000);
  178 |       }
  179 |     }
  180 |     const roomItem = page.locator('[class*="cursor-pointer"]').filter({ hasText: /غرفة|محادثة|فريق/i }).first();
  181 |     if (await roomItem.isVisible().catch(() => false)) {
```