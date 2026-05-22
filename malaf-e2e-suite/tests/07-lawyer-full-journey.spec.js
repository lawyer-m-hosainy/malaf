/**
 * مسار محامي كامل — يستخدم MALAF_TEST_EMAIL و MALAF_TEST_PASSWORD (لا تُحفظ في الملفات)
 */
const { test, expect } = require('@playwright/test');
const { waitForPageReady, attachConsoleMonitor } = require('../helpers/test-helpers');

const BASE = 'https://malaf.pro';
const EMAIL = process.env.MALAF_TEST_EMAIL;
const PASSWORD = process.env.MALAF_TEST_PASSWORD;

test.describe('مسار المحامي الكامل (حساب حقيقي)', () => {
  test.setTimeout(180000);

  test.beforeEach(() => {
    test.skip(!EMAIL || !PASSWORD, 'ضع MALAF_TEST_EMAIL و MALAF_TEST_PASSWORD');
  });

  async function login(page) {
    await page.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded' });
    await waitForPageReady(page);
    await page.locator('#login-email').fill(EMAIL);
    await page.locator('#password').fill(PASSWORD);
    await page.getByRole('button', { name: 'تسجيل الدخول', exact: true }).click();
    await page.waitForURL(/\/dashboard/, { timeout: 45000 });
    await waitForPageReady(page);
  }

  test('محامي: دخول → موكل → قضية → فريق → شات → فيديو → ثبات البيانات', async ({ page }) => {
    const errors = [];
    attachConsoleMonitor(page, errors);

    const ts = Date.now();
    const clientName = `موكل تجربة ${ts}`;
    const nationalId = `2990101${String(ts).slice(-7)}`.slice(0, 14);
    const caseNumber = `88-${String(ts).slice(-4)}-ت`;
    const caseTitle = `دعوى تجريبية آلية ${ts}`;
    const teamName = `محامي مساعد ${ts}`;
    const teamEmail = `assistant.${ts}@mailinator.com`;
    const chatMessage = `رسالة اختبار من المحامي — ${ts}`;

    const results = { login: false, client: false, case: false, team: false, chat: false, video: false, persist: false };

    // ─── 1) تسجيل الدخول ───
    await login(page);
    results.login = true;
    await expect(page).toHaveURL(/\/dashboard/);

    // ─── 2) موكل ───
    await page.goto(`${BASE}/dashboard/clients`, { waitUntil: 'domcontentloaded' });
    await waitForPageReady(page);
    await page.getByTestId('add-client-btn').click();
    await page.getByTestId('client-name-input').fill(clientName);
    await page.getByTestId('client-national-id-input').fill(nationalId);
    await page.locator('#phone').fill('01012345678');
    await page.getByTestId('save-client-btn').click();
    await expect(page.getByText(clientName).first()).toBeVisible({ timeout: 20000 });
    results.client = true;

    // ─── 3) عضو فريق ───
    await page.goto(`${BASE}/dashboard/team`, { waitUntil: 'domcontentloaded' });
    await waitForPageReady(page);
    const addTeamBtn = page.getByRole('button', { name: 'إضافة عضو جديد' });
    if (await addTeamBtn.isVisible().catch(() => false)) {
      await addTeamBtn.click();
      await page.getByPlaceholder('اسم العضو').fill(teamName);
      await page.getByPlaceholder('example@lawfirm.eg').fill(teamEmail);
      await page.getByRole('button', { name: 'حفظ العضو' }).click();
      await expect(page.getByText(teamName).first()).toBeVisible({ timeout: 15000 });
      results.team = true;
    }

    // ─── 4) قضية ───
    await page.goto(`${BASE}/dashboard/cases`, { waitUntil: 'domcontentloaded' });
    await waitForPageReady(page);
    await page.getByTestId('add-case-btn').click();
    await page.getByTestId('client-select').selectOption({ label: new RegExp(clientName) });
    await page.locator('input[placeholder*="مثلاً"]').first().fill(caseNumber);
    await page.getByTestId('case-title-input').fill(caseTitle);
    await page.locator('select[title="نوع القضية"]').selectOption('مدني');
    await page.locator('select[title="تصنيف القضية"]').selectOption('جزئي');
    await page.locator('select[title="المحكمة"]').selectOption({ index: 1 });
    await page.locator('input[placeholder="أسماء الخصوم"]').fill('شركة الخصم للاختبار');
    await page.getByTestId('save-case-btn').click();
    await expect(
      page.getByText('تم إضافة القضية').or(page.getByText(caseNumber)).first()
    ).toBeVisible({ timeout: 25000 });
    results.case = true;

    // ─── 5) شات ───
    await page.goto(`${BASE}/dashboard/chat`, { waitUntil: 'domcontentloaded' });
    await waitForPageReady(page);
    const roomBtn = page.locator('[class*="cursor-pointer"], button, a').filter({ hasText: /عام|فريق|داخلي|محادثة/i }).first();
    if (await roomBtn.isVisible().catch(() => false)) {
      await roomBtn.click();
      await page.waitForTimeout(1500);
    }
    const chatInput = page.locator('textarea, input[placeholder*="راسل"]').first();
    if (await chatInput.isVisible().catch(() => false)) {
      await chatInput.fill(chatMessage);
      await page.keyboard.press('Enter');
      await page.waitForTimeout(2000);
      results.chat = await page.getByText(chatMessage).first().isVisible().catch(() => false);
    }

    // ─── 6) زر مكالمة فيديو (لا نبدأ مكالمة حقيقية — نتحقق من الزر فقط) ───
    const videoBtn = page.locator('button[title="مكالمة فيديو"], button:has(svg)').filter({ has: page.locator('svg') });
    const videoIcon = page.getByRole('button', { name: /فيديو|مكالمة/i }).or(page.locator('button[title="مكالمة فيديو"]'));
    results.video = await videoIcon.first().isVisible().catch(() => false);

    // ─── 7) إعادة تحميل — ثبات ───
    await page.goto(`${BASE}/dashboard/clients`, { waitUntil: 'domcontentloaded' });
    await waitForPageReady(page);
    const clientOk = await page.getByText(clientName).first().isVisible().catch(() => false);
    await page.goto(`${BASE}/dashboard/cases`, { waitUntil: 'domcontentloaded' });
    await waitForPageReady(page);
    const caseOk = await page.getByText(caseNumber).first().isVisible().catch(() => false);
    results.persist = clientOk && caseOk;

    console.log('\n📋 تقرير مسار المحامي:');
    console.log(JSON.stringify(results, null, 2));
    if (errors.length) console.log(`⚠️ console errors: ${errors.length}`);

    test.info().annotations.push({ type: 'lawyer-audit', description: JSON.stringify(results) });

    expect(results.login, 'فشل تسجيل الدخول').toBe(true);
    expect(results.client, 'فشل إضافة الموكل').toBe(true);
    expect(results.case, 'فشل إضافة القضية').toBe(true);
    expect(results.persist, 'البيانات لم تثبت بعد إعادة التحميل').toBe(true);
  });
});
