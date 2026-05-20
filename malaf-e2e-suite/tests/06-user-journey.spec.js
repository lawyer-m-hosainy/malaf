// tests/06-user-journey.spec.js
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// الاختبار السادس: رحلة المستخدم الكاملة + فحص شامل
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const { test, expect } = require('@playwright/test');
const fs = require('fs');
const {
  waitForPageReady,
  attachConsoleMonitor,
  screenshotStep,
  checkPageStatus,
} = require('../helpers/test-helpers');

test.describe('رحلة المستخدم الكاملة والفحص الشامل', () => {
  let consoleErrors = [];
  let allPageErrors = [];

  test.beforeEach(async ({ page }) => {
    consoleErrors = [];
    attachConsoleMonitor(page, consoleErrors);
  });

  // ─────────────────────────────────────────────
  test('رحلة المستخدم: من الصفحة الرئيسية للتسجيل', async ({ page }) => {
    const journey = [];

    // خطوة 1: الصفحة الرئيسية
    await page.goto('https://malaf.pro');
    await waitForPageReady(page);
    journey.push({ step: 'الصفحة الرئيسية', url: page.url(), errors: [] });
    await screenshotStep(page, '06-journey-01-home');

    // خطوة 2: النقر على التسجيل
    const registerLink = page.locator(
      'a:has-text("تسجيل"), a:has-text("إنشاء"), a:has-text("ابدأ"), button:has-text("ابدأ الآن")'
    ).first();

    if (await registerLink.isVisible().catch(() => false)) {
      await registerLink.click();
      await waitForPageReady(page);
      journey.push({ step: 'صفحة التسجيل', url: page.url(), errors: [] });
      await screenshotStep(page, '06-journey-02-register');
    }

    // خطوة 3: صفحة تسجيل الدخول
    await page.goto('https://malaf.pro/login');
    await waitForPageReady(page);
    journey.push({ step: 'صفحة تسجيل الدخول', url: page.url(), errors: [] });
    await screenshotStep(page, '06-journey-03-login');

    console.log('\n  🗺️  خريطة الرحلة:');
    journey.forEach((step, i) => {
      console.log(`    ${i + 1}. ${step.step} → ${step.url}`);
    });

    test.info().annotations.push({
      type: 'user-journey',
      description: JSON.stringify(journey.map(s => ({ step: s.step, url: s.url }))),
    });
  });

  // ─────────────────────────────────────────────
  test('مسح شامل لجميع الروابط والأزرار في الصفحة الرئيسية', async ({ page }) => {
    await page.goto('https://malaf.pro');
    await waitForPageReady(page);

    // جمع كل الروابط
    const allLinks = await page.$$eval('a', anchors =>
      anchors.map(a => ({
        text: a.textContent?.trim().slice(0, 50),
        href: a.getAttribute('href'),
        visible: a.getBoundingClientRect().height > 0,
      })).filter(l => l.text && l.href)
    );

    // جمع كل الأزرار
    const allButtons = await page.$$eval('button', btns =>
      btns.map(b => ({
        text: b.textContent?.trim().slice(0, 50),
        type: b.type,
        disabled: b.disabled,
        visible: b.getBoundingClientRect().height > 0,
      })).filter(b => b.text)
    );

    console.log(`\n  🔗 إجمالي الروابط: ${allLinks.length}`);
    console.log(`  🔘 إجمالي الأزرار: ${allButtons.length}`);

    const internalLinks = allLinks.filter(l => l.href?.startsWith('/') || l.href?.includes('malaf.pro'));
    const externalLinks = allLinks.filter(l => l.href?.startsWith('http') && !l.href?.includes('malaf.pro'));

    console.log(`  📍 روابط داخلية: ${internalLinks.length}`);
    console.log(`  🌍 روابط خارجية: ${externalLinks.length}`);

    if (externalLinks.length > 0) {
      console.log('  ℹ️  الروابط الخارجية:');
      externalLinks.forEach(l => console.log(`    → ${l.text}: ${l.href}`));
    }

    test.info().annotations.push({
      type: 'page-audit',
      description: `روابط: ${allLinks.length} (داخلية: ${internalLinks.length}، خارجية: ${externalLinks.length}) | أزرار: ${allButtons.length}`,
    });
  });

  // ─────────────────────────────────────────────
  test('فحص نموذج التواصل أو طلب الاستشارة', async ({ page }) => {
    const contactPaths = ['/contact', '/consultation', '/request', '/استشارة'];

    for (const path of contactPaths) {
      const status = await checkPageStatus(page, `https://malaf.pro${path}`);
      if (status === 200) {
        console.log(`  ✓ صفحة التواصل: ${path}`);

        await page.goto(`https://malaf.pro${path}`, { waitUntil: 'domcontentloaded' });
        await waitForPageReady(page);
        await screenshotStep(page, `06-contact-${path.replace('/', '')}`);

        const formFields = await page.$$eval(
          'input, textarea, select',
          fields => fields.map(f => ({
            type: f.type || f.tagName,
            name: f.name || f.id,
            placeholder: f.placeholder,
            required: f.required,
          }))
        );

        console.log(`  📝 حقول النموذج (${formFields.length}):`);
        formFields.forEach(f => {
          console.log(`    • ${f.type} — ${f.name || f.placeholder || 'بدون اسم'} ${f.required ? '(مطلوب)' : ''}`);
        });

        test.info().annotations.push({
          type: 'contact-form',
          description: `${path}: ${formFields.length} حقول`,
        });
        break;
      }
    }
  });

  // ─────────────────────────────────────────────
  test('فحص صفحة الأسعار والاشتراكات', async ({ page }) => {
    const pricingPaths = ['/pricing', '/plans', '/subscription', '/اشتراك'];

    for (const path of pricingPaths) {
      const status = await checkPageStatus(page, `https://malaf.pro${path}`);
      if (status === 200) {
        console.log(`  ✓ صفحة الأسعار: ${path}`);
        await page.goto(`https://malaf.pro${path}`, { waitUntil: 'domcontentloaded' });
        await waitForPageReady(page);
        await screenshotStep(page, '06-pricing');

        // فحص وجود خطط الأسعار
        const planCards = page.locator('[class*="plan"], [class*="pricing"], [class*="card"]');
        const planCount = await planCards.count();
        console.log(`  📊 عدد خطط الأسعار المكتشفة: ${planCount}`);

        test.info().annotations.push({
          type: 'pricing-page',
          description: `${path}: ${planCount} خطة`,
        });
        break;
      }
    }
  });

  // ─────────────────────────────────────────────
  test('فحص أمان المنصة (Security Headers)', async ({ page }) => {
    const response = await page.goto('https://malaf.pro', { waitUntil: 'domcontentloaded' });
    const headers = response?.headers() || {};

    const securityHeaders = {
      'x-frame-options': headers['x-frame-options'],
      'x-content-type-options': headers['x-content-type-options'],
      'strict-transport-security': headers['strict-transport-security'],
      'content-security-policy': headers['content-security-policy'] ? 'موجود ✓' : undefined,
      'x-xss-protection': headers['x-xss-protection'],
      'referrer-policy': headers['referrer-policy'],
    };

    console.log('\n  🔐 Headers الأمان:');
    const missing = [];
    for (const [header, value] of Object.entries(securityHeaders)) {
      if (value) {
        console.log(`  ✓ ${header}: ${value.slice(0, 60)}`);
      } else {
        console.log(`  ✗ ${header}: غير موجود`);
        missing.push(header);
      }
    }

    if (missing.length > 0) {
      console.log(`\n  ⚠️  Headers مفقودة (${missing.length}): ${missing.join(', ')}`);
    }

    test.info().annotations.push({
      type: 'security-headers',
      description: `مفقود: ${missing.length > 0 ? missing.join(', ') : 'لا شيء ✓'}`,
    });
  });

  // ─────────────────────────────────────────────
  test('فحص HTTPS والشهادة الأمنية', async ({ page }) => {
    await page.goto('https://malaf.pro');
    const url = page.url();

    expect(url.startsWith('https://'), 'المنصة لا تستخدم HTTPS!').toBe(true);
    console.log('  ✓ المنصة تستخدم HTTPS');

    // فحص هل يتم إعادة التوجيه من HTTP إلى HTTPS
    const httpResponse = await page.goto('http://malaf.pro', { timeout: 10000 }).catch(() => null);
    if (httpResponse) {
      const finalUrl = page.url();
      if (finalUrl.startsWith('https://')) {
        console.log('  ✓ إعادة توجيه HTTP → HTTPS تعمل');
      } else {
        console.warn('  ⚠️  لا توجد إعادة توجيه من HTTP إلى HTTPS');
      }
    }
  });

  // ─────────────────────────────────────────────
  test('إنشاء تقرير JSON تفصيلي بنتائج الفحص الشامل', async ({ page }) => {
    const report = {
      timestamp: new Date().toISOString(),
      platform: 'malaf.pro',
      tester: 'Playwright E2E Audit Suite v1.0',
      note: 'تقرير قراءة فقط - لا تعديلات على الكود أو البيانات',
      checklist: {
        homepage: {},
        registration: {},
        login: {},
        dashboard: {},
        aiAgent: {},
        chat: {},
        videoCall: {},
        security: {},
        performance: {},
      },
    };

    // فحص سريع لكل قسم
    const checks = [
      { key: 'homepage', url: '/', name: 'الصفحة الرئيسية' },
      { key: 'login', url: '/login', name: 'تسجيل الدخول' },
      { key: 'registration', url: '/register', name: 'التسجيل' },
      { key: 'dashboard', url: '/dashboard', name: 'لوحة التحكم' },
      { key: 'chat', url: '/chat', name: 'الدردشة' },
      { key: 'videoCall', url: '/video-call', name: 'مكالمة الفيديو' },
    ];

    for (const check of checks) {
      const start = Date.now();
      const status = await checkPageStatus(page, `https://malaf.pro${check.url}`);
      const loadTime = Date.now() - start;

      report.checklist[check.key] = {
        url: `https://malaf.pro${check.url}`,
        status,
        loadTime,
        accessible: status !== 404 && status !== 0,
        requiresAuth: status === 302 || status === 401,
      };

      console.log(`  ${status !== 404 ? '✓' : '✗'} ${check.name}: ${status} (${loadTime}ms)`);
    }

    fs.mkdirSync('reports', { recursive: true });
    fs.writeFileSync('reports/full-audit.json', JSON.stringify(report, null, 2));
    console.log('\n  💾 تقرير JSON محفوظ في: reports/full-audit.json');

    test.info().annotations.push({
      type: 'json-report',
      description: 'تقرير تفصيلي في reports/full-audit.json',
    });
  });
});
