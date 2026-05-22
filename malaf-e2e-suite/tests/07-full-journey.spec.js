// رحلة كاملة: تسجيل → موكل → قضية → شات وفيديو
const { test, expect } = require('@playwright/test');
const { generateFakeOffice, waitForPageReady, screenshotStep } = require('../helpers/test-helpers');

const BASE = 'https://malaf.pro';

test.describe('رحلة المستخدم الكاملة على malaf.pro', () => {
  test.setTimeout(180000);

  test('تسجيل مكتب → موكل → قضية → شات وفيديو', async ({ page }) => {
    const office = generateFakeOffice();
    const ts = Date.now();
    const clientName = `موكل اختبار ${ts}`;
    const caseTitle = `قضية اختبار ${ts}`;
    const caseNumber = `99-${String(ts).slice(-4)}-ت`;
    const nationalId = `2${String(ts).padStart(13, '0').slice(0, 13)}`;
    const results = { register: null, client: null, case: null, chat: null, video: null };

    // ─── 1. تسجيل حساب جديد ───
    await page.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded' });
    await waitForPageReady(page);

    await page.getByRole('button', { name: /إنشاء حساب جديد/i }).click();
    await page.locator('#register-name').fill(office.lawyerName);
    await page.locator('#register-email').fill(office.email);
    await page.locator('#register-password').fill(office.password);
    await page.locator('#register-confirm').fill(office.password);
    await screenshotStep(page, '07-register-filled');

    await page.getByRole('button', { name: /إنشاء الحساب/i }).click();
    await page.waitForTimeout(5000);

    const urlAfterReg = page.url();
    const needsEmail = urlAfterReg.includes('/login');
    const loggedIn = urlAfterReg.includes('/dashboard') || urlAfterReg.includes('/onboarding');

    if (needsEmail && !loggedIn) {
      results.register = { ok: false, reason: 'يتطلب تفعيل البريد — لا يمكن إكمال الرحلة تلقائياً', email: office.email };
      console.log('⚠️ التسجيل يتطلب تفعيل البريد:', office.email);
      test.info().attach('credentials', { body: JSON.stringify(office, null, 2), contentType: 'application/json' });
      // محاولة تسجيل الدخول إن كان التفعيل معطلاً
      await page.locator('input[type="email"]').first().fill(office.email);
      await page.locator('input[type="password"]').first().fill(office.password);
      await page.getByRole('button', { name: 'تسجيل الدخول', exact: true }).click();
      await page.waitForTimeout(4000);
    }

    if (page.url().includes('/onboarding')) {
      await page.locator('#officeName, input[id="officeName"]').first().fill(office.name).catch(() => {});
      await page.locator('#adminName, input[id="adminName"]').first().fill(office.lawyerName).catch(() => {});
      for (let s = 0; s < 3; s++) {
        const next = page.getByRole('button', { name: /التالي/i });
        if (await next.isVisible().catch(() => false)) await next.click();
        await page.waitForTimeout(500);
      }
      const createBtn = page.getByRole('button', { name: /إنشاء المكتب/i });
      if (await createBtn.isVisible().catch(() => false)) {
        await createBtn.click();
        await page.waitForURL(/dashboard/, { timeout: 30000 }).catch(() => {});
      }
    }

    await waitForPageReady(page);
    await screenshotStep(page, '07-after-register');

    const onDashboard = page.url().includes('/dashboard');
    const onOnboarding = page.url().includes('/onboarding');
    results.register = {
      ok: onDashboard || onOnboarding,
      url: page.url(),
      email: office.email,
      password: office.password,
    };
    console.log('📋 تسجيل:', results.register);

    expect(results.register.ok, `فشل التسجيل — ${page.url()}`).toBe(true);

    // ─── 2. إضافة موكل ───
    await page.goto(`${BASE}/dashboard/clients`, { waitUntil: 'domcontentloaded' });
    await waitForPageReady(page);
    await page.getByTestId('add-client-btn').click({ timeout: 15000 });
    await page.getByTestId('client-name-input').fill(clientName);
    // رقم قومي مصري صالح: 14 رقم يبدأ بـ 2 أو 3
    await page.getByTestId('client-national-id-input').fill(nationalId);
    await page.getByPlaceholder(/رقم الهاتف المصري|01/i).fill(`010${String(ts).slice(-8)}`);
    await screenshotStep(page, '07-client-form');
    await page.getByTestId('save-client-btn').click();

    const successToast = page.getByText('تم إضافة العميل بنجاح');
    const errorToast = page.locator('[data-sonner-toast], [role="alert"]').filter({ hasText: /خطأ|فشل|مسجل|مكتب/i });
    await Promise.race([
      successToast.waitFor({ state: 'visible', timeout: 20000 }),
      errorToast.first().waitFor({ state: 'visible', timeout: 20000 }),
    ]).catch(() => {});

    const toastError = await errorToast.first().textContent().catch(() => null);
    await page.waitForTimeout(1500);
    await page.reload({ waitUntil: 'domcontentloaded' });
    await waitForPageReady(page);

    const clientVisible = await page.getByText(clientName).isVisible().catch(() => false);
    results.client = { ok: clientVisible, name: clientName, nationalId, toastError };
    console.log('👤 موكل:', results.client);
    if (!clientVisible) {
      console.log('⚠️ تخطي القضية — الموكل لم يُحفظ');
    }

    // ─── 3. إضافة قضية ───
    await page.goto(`${BASE}/dashboard/cases`, { waitUntil: 'domcontentloaded' });
    await waitForPageReady(page);
    await page.getByTestId('add-case-btn').click({ timeout: 15000 });

    const clientSelect = page.getByTestId('client-select');
    const optionCount = await clientSelect.locator('option').count();
    if (optionCount <= 1) {
      results.case = { ok: false, reason: 'لا يوجد موكل في القائمة — أضف موكلاً أولاً' };
      console.log('⚖️ قضية:', results.case);
    } else {
    await clientSelect.selectOption({ label: clientName }).catch(async () => {
      await clientSelect.selectOption({ index: 1 });
    });

    await page.locator('input[placeholder*="مثلاً: 45-123-ت"]').fill(caseNumber);
    await page.getByTestId('case-title-input').fill(caseTitle);

    // رقم التوكيل (إجباري)
    const poaNum = page.locator('input[placeholder="رقم"]').first();
    if (await poaNum.isVisible().catch(() => false)) {
      await poaNum.fill('1234');
      await page.locator('select[title="حرف التوكيل"]').selectOption('ب');
      await page.locator('input[placeholder="سنة"]').fill('2024');
    }

    const courtCat = page.locator('select[title="التصنيف الأساسي"]');
    if (await courtCat.isVisible().catch(() => false)) {
      await courtCat.selectOption({ label: 'تجاري' }).catch(() => courtCat.selectOption({ index: 1 }));
      await page.locator('select[title="نوع المحكمة"]').selectOption({ index: 1 }).catch(() => {});
      await page.locator('select[title="مقر المحكمة"]').selectOption({ index: 1 }).catch(() => {});
    }

    const roleSelect = page.locator('select[title="صفة الموكل"]');
    if (await roleSelect.isVisible().catch(() => false)) {
      await roleSelect.selectOption('مدعي');
    }
    await page.locator('input[placeholder="أسماء الخصوم"]').fill('شركة الخصم للاختبار').catch(() => {});

    await screenshotStep(page, '07-case-form');
    await page.getByTestId('save-case-btn').click();
    await page.waitForTimeout(4000);

    const caseVisible =
      (await page.getByText(caseNumber).isVisible().catch(() => false)) ||
      (await page.getByText(caseTitle).isVisible().catch(() => false)) ||
      (await page.locator('text=تم إضافة القضية').isVisible().catch(() => false));

    results.case = { ok: caseVisible, number: caseNumber, title: caseTitle };
    console.log('⚖️ قضية:', results.case);
    }

    // ─── 4. قسم الشات ───
    await page.goto(`${BASE}/dashboard/chat`, { waitUntil: 'domcontentloaded' });
    await waitForPageReady(page);
    await screenshotStep(page, '07-chat-page');

    const chatInput = page.locator('textarea, input[type="text"]').filter({ hasNot: page.locator('[type="search"]') }).first();
    const hasChatInput = await chatInput.isVisible().catch(() => false);
    const hasSidebar = await page.locator('[class*="sidebar"], aside, [class*="ChatSidebar"]').first().isVisible().catch(() => false);

    // إنشاء غرفة محادثة إن لم تكن موجودة
    const newRoomBtn = page.getByRole('button', { name: /غرفة|محادثة جديدة|إنشاء/i }).first();
    if (await newRoomBtn.isVisible().catch(() => false)) {
      await newRoomBtn.click();
      const roomNameInput = page.locator('input').filter({ hasNot: page.locator('[placeholder*="ابحث"]') }).first();
      if (await roomNameInput.isVisible().catch(() => false)) {
        await roomNameInput.fill(`غرفة اختبار ${ts}`);
        await page.getByRole('button', { name: /إنشاء|حفظ/i }).last().click().catch(() => {});
        await page.waitForTimeout(2000);
      }
    }
    const roomItem = page.locator('[class*="cursor-pointer"]').filter({ hasText: /غرفة|محادثة|فريق/i }).first();
    if (await roomItem.isVisible().catch(() => false)) {
      await roomItem.click();
      await page.waitForTimeout(1500);
    }

    let messageSent = false;
    const chatInputAfterRoom = page.locator('textarea').first();
    if (await chatInputAfterRoom.isVisible().catch(() => false)) {
      await chatInputAfterRoom.fill('مرحباً، هذا اختبار تلقائي من Playwright');
      const sendBtn = page.getByRole('button', { name: /إرسال/i }).first();
      if (await sendBtn.isVisible().catch(() => false)) {
        await sendBtn.click();
        await page.waitForTimeout(2000);
        messageSent = true;
      }
    } else if (hasChatInput) {
      await chatInput.fill('مرحباً، هذا اختبار تلقائي من Playwright');
      const sendBtn = page.getByRole('button', { name: /إرسال/i }).first();
      if (await sendBtn.isVisible().catch(() => false)) {
        await sendBtn.click();
        await page.waitForTimeout(2000);
        messageSent = true;
      }
    }

    const chatPageLoaded = page.url().includes('/chat');
    results.chat = { ok: chatPageLoaded && (hasChatInput || hasSidebar || messageSent), hasInput: hasChatInput, hasSidebar, messageSent, url: page.url() };
    console.log('💬 شات:', results.chat);

    // ─── 5. مكالمة الفيديو (من داخل الشات) ───
    const videoBtn = page.locator('button[title="مكالمة فيديو"]').first();
    const hasVideoBtn = await videoBtn.isVisible().catch(() => false);
    let videoStarted = false;

    if (hasVideoBtn) {
      const [popup] = await Promise.all([
        page.context().waitForEvent('page', { timeout: 8000 }).catch(() => null),
        videoBtn.click(),
      ]);
      videoStarted = !!popup || (await page.locator('text=/meet|daily|video|مكالمة/i').first().isVisible().catch(() => false));
    }

    // مسار بديل: /video-call قد يعيد توجيه
    if (!videoStarted) {
      const res = await page.goto(`${BASE}/video-call`, { waitUntil: 'domcontentloaded', timeout: 15000 }).catch(() => null);
      const status = res?.status() ?? 0;
      videoStarted = page.url().includes('chat') || status === 200;
      results.video = { ok: videoStarted, path: '/video-call', status, url: page.url(), buttonInChat: hasVideoBtn };
    } else {
      results.video = { ok: true, via: 'chat-button', buttonInChat: hasVideoBtn };
    }

    await screenshotStep(page, '07-video-chat');
    console.log('📹 فيديو:', results.video);

    test.info().annotations.push({
      type: 'journey-summary',
      description: JSON.stringify(results),
    });

    console.log('\n══════════ ملخص الرحلة ══════════');
    console.log(JSON.stringify(results, null, 2));
    console.log('بيانات الحساب:', office.email, office.password);
  });
});
