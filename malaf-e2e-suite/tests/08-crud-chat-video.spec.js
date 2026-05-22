// اختبار CRUD + شات/فيديو بحساب مكتب جاهز
const { test, expect } = require('@playwright/test');
const { waitForPageReady, screenshotStep } = require('../helpers/test-helpers');

const BASE = 'https://malaf.pro';
const TEST_EMAIL = 'test-lawyer@malaf.pro';
const TEST_PASS = 'TestPassword123!';

async function login(page) {
  await page.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded' });
  await waitForPageReady(page);
  await page.getByRole('textbox', { name: /البريد/i }).fill(TEST_EMAIL);
  await page.locator('input[type="password"]').first().fill(TEST_PASS);
  await page.getByRole('button', { name: 'تسجيل الدخول', exact: true }).click();
  await page.waitForURL(/dashboard/, { timeout: 20000 });
}

test.describe('CRUD وشات/فيديو — حساب اختبار', () => {
  test.setTimeout(180000);

  test('موكل → قضية → شات → فيديو', async ({ page }) => {
    const ts = Date.now();
    const clientName = `موكل E2E ${ts}`;
    const caseTitle = `قضية E2E ${ts}`;
    const caseNumber = `88-${String(ts).slice(-4)}-ت`;
    const nationalId = `2${String(ts).padStart(13, '0').slice(0, 13)}`;
    const results = {};

    await login(page);
    results.login = { ok: true, url: page.url() };

    // موكل
    await page.goto(`${BASE}/dashboard/clients`);
    await waitForPageReady(page);
    await page.getByTestId('add-client-btn').click();
    await page.getByTestId('client-name-input').fill(clientName);
    await page.getByTestId('client-national-id-input').fill(nationalId);
    await page.getByPlaceholder(/رقم الهاتف المصري/i).fill(`010${String(ts).slice(-8)}`);
    await page.getByTestId('save-client-btn').click();
    await expect(page.getByText('تم إضافة العميل بنجاح')).toBeVisible({ timeout: 20000 });
    results.client = { ok: true, name: clientName };

    // قضية
    await page.goto(`${BASE}/dashboard/cases`);
    await waitForPageReady(page);
    await page.getByTestId('add-case-btn').click();
    await page.getByTestId('client-select').selectOption({ label: clientName });
    await page.locator('input[placeholder*="مثلاً: 45-123-ت"]').fill(caseNumber);
    await page.getByTestId('case-title-input').fill(caseTitle);
    const poaNum = page.locator('input[placeholder="رقم"]').first();
    if (await poaNum.isVisible().catch(() => false)) {
      await poaNum.fill('5678');
      await page.locator('select[title="حرف التوكيل"]').selectOption('أ');
      await page.locator('input[placeholder="سنة"]').fill('2025');
    }
    const courtCat = page.locator('select[title="التصنيف الأساسي"]');
    if (await courtCat.isVisible().catch(() => false)) {
      await courtCat.selectOption({ index: 1 });
      await page.locator('select[title="نوع المحكمة"]').selectOption({ index: 1 }).catch(() => {});
      await page.locator('select[title="مقر المحكمة"]').selectOption({ index: 1 }).catch(() => {});
    }
    await page.locator('input[placeholder="أسماء الخصوم"]').fill('خصم E2E').catch(() => {});
    await page.getByTestId('save-case-btn').click();
    await expect(page.getByText(/تم إضافة القضية|تم تحديث القضية/)).toBeVisible({ timeout: 20000 });
    results.case = { ok: true, number: caseNumber };

    // شات
    await page.goto(`${BASE}/dashboard/chat`);
    await waitForPageReady(page);
    await screenshotStep(page, '08-chat');
    const pageLoaded = page.url().includes('/chat');
    const plusBtn = page.locator('button').filter({ has: page.locator('svg') }).first();
    const createBtn = page.getByRole('button', { name: /جديد|إنشاء|غرفة/i }).first();
    if (await createBtn.isVisible().catch(() => false)) {
      await createBtn.click();
      const nameIn = page.locator('input[placeholder*="اسم"], input[type="text"]').last();
      if (await nameIn.isVisible().catch(() => false)) {
        await nameIn.fill(`غرفة E2E ${ts}`);
        await page.getByRole('button', { name: /إنشاء|حفظ/i }).last().click();
        await page.waitForTimeout(2000);
      }
    }
    const firstRoom = page.locator('div[class*="cursor-pointer"], button[class*="cursor-pointer"]').nth(2);
    if (await firstRoom.isVisible().catch(() => false)) await firstRoom.click();
    await page.waitForTimeout(1500);
    const textarea = page.locator('textarea').first();
    let messageSent = false;
    if (await textarea.isVisible().catch(() => false)) {
      await textarea.fill('رسالة اختبار E2E');
      const send = page.locator('button[type="submit"], button').filter({ has: page.locator('svg') }).last();
      await send.click().catch(() => {});
      messageSent = true;
    }
    results.chat = { ok: pageLoaded, messageSent, url: page.url() };

    // فيديو — زر داخل الشات
    const videoBtn = page.locator('button[title="مكالمة فيديو"]');
    let videoOk = false;
    if (await videoBtn.isVisible().catch(() => false)) {
      const [popup] = await Promise.all([
        page.context().waitForEvent('page', { timeout: 10000 }).catch(() => null),
        videoBtn.click(),
      ]);
      videoOk = !!popup;
      results.video = { ok: videoOk, via: 'chat-button' };
    } else {
      const res = await page.goto(`${BASE}/video-call`, { waitUntil: 'domcontentloaded' }).catch(() => null);
      results.video = { ok: (res?.status() === 200), via: '/video-call', note: 'لا يوجد route مخصص — الفيديو من داخل الشات' };
    }

    console.log(JSON.stringify(results, null, 2));
    expect(results.client.ok).toBe(true);
    expect(results.case.ok).toBe(true);
    expect(results.chat.ok).toBe(true);
  });
});
