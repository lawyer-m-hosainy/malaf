// tests/05-chat-video.spec.js
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// الاختبار الخامس: دردشة النص ومكالمات الفيديو
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const { test, expect } = require('@playwright/test');
const {
  waitForPageReady,
  attachConsoleMonitor,
  screenshotStep,
  checkPageStatus,
} = require('../helpers/test-helpers');

test.describe('دردشة النص ومكالمات الفيديو', () => {
  let consoleErrors = [];

  test.beforeEach(async ({ page }) => {
    consoleErrors = [];
    attachConsoleMonitor(page, consoleErrors);
  });

  // ─────────────────────────────────────────────
  // قسم أول: دردشة النصوص
  // ─────────────────────────────────────────────

  test('إيجاد صفحة / مكون الدردشة النصية', async ({ page }) => {
    const chatPaths = [
      '/chat', '/messages', '/inbox',
      '/office/chat', '/office/messages',
      '/conversations', '/consultations',
    ];

    const found = [];
    for (const path of chatPaths) {
      const status = await checkPageStatus(page, `https://malaf.pro${path}`);
      if (status !== 404 && status !== 0) {
        found.push({ path, status });
        console.log(`  ✓ ${path} → ${status}`);

        // فحص محتوى الصفحة
        await page.goto(`https://malaf.pro${path}`, { waitUntil: 'domcontentloaded' });
        await waitForPageReady(page).catch(() => {});
        await screenshotStep(page, `05-chat-${path.replace('/', '')}`);

        // تحقق من وجود عناصر الدردشة
        const hasChatInput = await page.locator(
          'textarea, input[type="text"][placeholder*="رسالة"], [class*="chat-input"]'
        ).first().isVisible().catch(() => false);

        const hasMessageList = await page.locator(
          '[class*="message"], [class*="chat-body"], [class*="conversation"]'
        ).first().isVisible().catch(() => false);

        console.log(`    📱 حقل إدخال رسالة: ${hasChatInput ? '✓' : '✗'}`);
        console.log(`    💬 قائمة رسائل: ${hasMessageList ? '✓' : '✗'}`);
      }
    }

    test.info().annotations.push({
      type: 'chat-pages',
      description: found.length > 0
        ? found.map(f => f.path).join(', ')
        : '⚠️ لم يُعثر على صفحة دردشة',
    });
  });

  // ─────────────────────────────────────────────
  test('اختبار وظائف الدردشة النصية', async ({ page }) => {
    const chatPaths = ['/chat', '/messages', '/office/chat'];
    let chatFound = false;

    for (const path of chatPaths) {
      await page.goto(`https://malaf.pro${path}`, { waitUntil: 'domcontentloaded' });
      await waitForPageReady(page).catch(() => {});

      if (page.url().includes('login')) continue;

      const chatInput = page.locator('textarea, input[type="text"]').first();
      if (await chatInput.isVisible().catch(() => false)) {
        chatFound = true;

        // اختبار الكتابة
        await chatInput.click();
        await chatInput.type('مرحباً، لدي استفسار قانوني');
        const value = await chatInput.inputValue().catch(() => '');
        expect(value.length, 'لا يمكن الكتابة في حقل الدردشة').toBeGreaterThan(0);
        console.log('  ✓ يمكن الكتابة في حقل الدردشة');

        // اختبار زر الإرسال
        const sendBtn = page.locator(
          'button[type="submit"], button:has-text("إرسال"), [aria-label*="إرسال"]'
        ).first();
        const sendBtnVisible = await sendBtn.isVisible().catch(() => false);
        console.log(`  ${sendBtnVisible ? '✓' : '✗'} زر الإرسال`);

        // اختبار المرفقات / الإيموجي
        const attachBtn = page.locator(
          'button[aria-label*="مرفق"], button[aria-label*="ملف"], input[type="file"], [class*="attach"]'
        ).first();
        const hasAttach = await attachBtn.isVisible().catch(() => false);
        console.log(`  ${hasAttach ? '✓' : '-'} زر المرفقات`);

        await screenshotStep(page, '05-chat-typing');
        break;
      }
    }

    if (!chatFound) {
      console.log('  ℹ️  واجهة الدردشة محمية بتسجيل الدخول أو لم يُعثر عليها');
      test.info().annotations.push({
        type: 'chat-status',
        description: 'واجهة الدردشة تتطلب مصادقة',
      });
    }
  });

  // ─────────────────────────────────────────────
  test('فحص WebSocket / Polling للدردشة الحية', async ({ page }) => {
    const wsConnections = [];
    const xhrRequests = [];

    // مراقبة اتصالات WebSocket
    page.on('websocket', ws => {
      wsConnections.push(ws.url());
      console.log(`  🔌 WebSocket اتصال: ${ws.url()}`);

      ws.on('framesent', frame => {
        console.log(`    ↑ إرسال frame: ${frame.payload?.toString()?.slice(0, 100)}`);
      });
      ws.on('framereceived', frame => {
        console.log(`    ↓ استقبال frame: ${frame.payload?.toString()?.slice(0, 100)}`);
      });
    });

    // مراقبة طلبات الـ polling
    page.on('request', req => {
      if (req.url().includes('poll') || req.url().includes('realtime') || req.url().includes('stream')) {
        xhrRequests.push(req.url());
      }
    });

    await page.goto('https://malaf.pro/chat', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(5000);

    console.log(`  📡 اتصالات WebSocket: ${wsConnections.length}`);
    console.log(`  🔄 طلبات Polling: ${xhrRequests.length}`);

    test.info().annotations.push({
      type: 'realtime-connections',
      description: `WebSocket: ${wsConnections.length} | Polling: ${xhrRequests.length} | URLs: ${wsConnections.join(', ')}`,
    });
  });

  // ─────────────────────────────────────────────
  // قسم ثاني: مكالمات الفيديو
  // ─────────────────────────────────────────────

  test('إيجاد ميزة مكالمة الفيديو', async ({ page }) => {
    const videoPaths = [
      '/video', '/video-call', '/call',
      '/office/video', '/consult/video',
      '/meeting', '/room',
    ];

    const found = [];
    for (const path of videoPaths) {
      const status = await checkPageStatus(page, `https://malaf.pro${path}`);
      if (status !== 404 && status !== 0) {
        found.push({ path, status });
        console.log(`  ✓ مسار الفيديو: ${path} → ${status}`);
      }
    }

    // البحث في الصفحة الرئيسية عن ميزة الفيديو
    await page.goto('https://malaf.pro');
    await waitForPageReady(page);

    const videoElements = await page.locator(
      'a:has-text("فيديو"), a:has-text("video"), a:has-text("مكالمة"), button:has-text("اتصال"), [href*="video"], [href*="call"]'
    ).count();

    console.log(`  📹 روابط الفيديو في الصفحة الرئيسية: ${videoElements}`);

    test.info().annotations.push({
      type: 'video-call-feature',
      description: found.length > 0
        ? `مسارات فيديو: ${found.map(f => f.path).join(', ')}`
        : `⚠️ لا يوجد مسار فيديو مباشر | روابط في الرئيسية: ${videoElements}`,
    });
  });

  // ─────────────────────────────────────────────
  test('فحص أذونات الكاميرا والمايكروفون', async ({ page, context }) => {
    // منح أذونات وهمية للاختبار
    await context.grantPermissions(['camera', 'microphone']);

    const videoPaths = ['/video-call', '/call', '/video', '/meeting', '/room'];
    let videoPageFound = false;

    for (const path of videoPaths) {
      await page.goto(`https://malaf.pro${path}`, { waitUntil: 'domcontentloaded' });
      await waitForPageReady(page).catch(() => {});

      if (!page.url().includes('404') && !page.url().includes('login')) {
        videoPageFound = true;
        console.log(`  ✓ وُجدت صفحة فيديو: ${path}`);
        await screenshotStep(page, '05-video-call-page');

        // تحقق من وجود عناصر الفيديو
        const videoEl = page.locator('video, [class*="video-player"], [class*="webcam"]').first();
        const hasVideo = await videoEl.isVisible().catch(() => false);

        // تحقق من أزرار التحكم
        const muteBtn = page.locator(
          'button[aria-label*="مايكروفون"], button[aria-label*="صوت"], button:has-text("كتم"), [class*="mute"]'
        ).first();
        const hasMute = await muteBtn.isVisible().catch(() => false);

        const cameraBtn = page.locator(
          'button[aria-label*="كاميرا"], button:has-text("كاميرا"), [class*="camera"]'
        ).first();
        const hasCamera = await cameraBtn.isVisible().catch(() => false);

        const endCallBtn = page.locator(
          'button[aria-label*="إنهاء"], button:has-text("إنهاء"), button:has-text("خروج"), [class*="end-call"]'
        ).first();
        const hasEndCall = await endCallBtn.isVisible().catch(() => false);

        console.log(`    🎥 عنصر الفيديو: ${hasVideo ? '✓' : '✗'}`);
        console.log(`    🎤 زر كتم الصوت: ${hasMute ? '✓' : '✗'}`);
        console.log(`    📷 زر الكاميرا: ${hasCamera ? '✓' : '✗'}`);
        console.log(`    📵 زر إنهاء المكالمة: ${hasEndCall ? '✓' : '✗'}`);

        test.info().annotations.push({
          type: 'video-ui-elements',
          description: `فيديو:${hasVideo} | كتم:${hasMute} | كاميرا:${hasCamera} | إنهاء:${hasEndCall}`,
        });
        break;
      }
    }

    if (!videoPageFound) {
      console.log('  ℹ️  صفحة مكالمة الفيديو محمية أو غير متاحة للعموم');
      test.info().annotations.push({
        type: 'video-status',
        description: 'مكالمة الفيديو تتطلب مصادقة أو رابط جلسة خاص',
      });
    }
  });

  // ─────────────────────────────────────────────
  test('فحص دعم WebRTC لمكالمات الفيديو', async ({ page }) => {
    await page.goto('https://malaf.pro');

    // فحص دعم WebRTC في المتصفح
    const webRTCSupport = await page.evaluate(() => {
      return {
        RTCPeerConnection: typeof RTCPeerConnection !== 'undefined',
        getUserMedia: typeof navigator.mediaDevices?.getUserMedia === 'function',
        RTCDataChannel: typeof RTCDataChannel !== 'undefined',
      };
    });

    console.log('  📡 دعم WebRTC:');
    console.log(`    RTCPeerConnection: ${webRTCSupport.RTCPeerConnection ? '✓' : '✗'}`);
    console.log(`    getUserMedia: ${webRTCSupport.getUserMedia ? '✓' : '✗'}`);
    console.log(`    RTCDataChannel: ${webRTCSupport.RTCDataChannel ? '✓' : '✗'}`);

    // فحص مكتبات الفيديو المُحمَّلة في المنصة
    const videoLibraries = await page.evaluate(() => {
      return {
        agora: typeof AgoraRTC !== 'undefined',
        twilio: typeof Twilio !== 'undefined',
        daily: typeof DailyIframe !== 'undefined',
        jitsi: typeof JitsiMeetExternalAPI !== 'undefined',
        zoom: typeof ZoomMtg !== 'undefined',
        webRTCAdapter: typeof adapter !== 'undefined',
      };
    });

    const detectedLibs = Object.entries(videoLibraries)
      .filter(([, v]) => v)
      .map(([k]) => k);

    console.log(`  📚 مكتبات الفيديو المكتشفة: ${detectedLibs.length > 0 ? detectedLibs.join(', ') : 'لا شيء مكتشف في الصفحة الرئيسية'}`);

    test.info().annotations.push({
      type: 'webrtc-support',
      description: `WebRTC: ${JSON.stringify(webRTCSupport)} | Libraries: ${detectedLibs.join(', ') || 'none detected'}`,
    });

    // WebRTC يجب أن يكون مدعوماً على الأقل
    expect(webRTCSupport.RTCPeerConnection, 'المتصفح لا يدعم WebRTC').toBe(true);
  });

  // ─────────────────────────────────────────────
  test('فحص أداء التحميل لصفحات الفيديو والشات', async ({ page }) => {
    const pagesToTest = [
      { url: '/chat', name: 'الدردشة' },
      { url: '/video-call', name: 'مكالمة الفيديو' },
    ];

    for (const { url, name } of pagesToTest) {
      const start = Date.now();
      await page.goto(`https://malaf.pro${url}`, { waitUntil: 'domcontentloaded', timeout: 20000 })
        .catch(() => {});
      const loadTime = Date.now() - start;

      console.log(`  ⏱  ${name}: ${loadTime}ms`);

      const perf = await page.evaluate(() => {
        const nav = performance.getEntriesByType('navigation')[0];
        return nav ? {
          dns: Math.round(nav.domainLookupEnd - nav.domainLookupStart),
          tcp: Math.round(nav.connectEnd - nav.connectStart),
          ttfb: Math.round(nav.responseStart - nav.requestStart),
          domLoaded: Math.round(nav.domContentLoadedEventEnd),
        } : null;
      }).catch(() => null);

      if (perf) {
        console.log(`    DNS: ${perf.dns}ms | TCP: ${perf.tcp}ms | TTFB: ${perf.ttfb}ms | DOM: ${perf.domLoaded}ms`);
        test.info().annotations.push({
          type: `performance-${name}`,
          description: `تحميل: ${loadTime}ms | DNS: ${perf.dns}ms | TTFB: ${perf.ttfb}ms`,
        });
      }
    }
  });
});
