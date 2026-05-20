# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: 05-chat-video.spec.js >> دردشة النص ومكالمات الفيديو >> فحص أذونات الكاميرا والمايكروفون
- Location: tests\05-chat-video.spec.js:192:3

# Error details

```
Error: browserContext.grantPermissions: Unknown permission: camera
```

# Test source

```ts
  94  | 
  95  |         // اختبار المرفقات / الإيموجي
  96  |         const attachBtn = page.locator(
  97  |           'button[aria-label*="مرفق"], button[aria-label*="ملف"], input[type="file"], [class*="attach"]'
  98  |         ).first();
  99  |         const hasAttach = await attachBtn.isVisible().catch(() => false);
  100 |         console.log(`  ${hasAttach ? '✓' : '-'} زر المرفقات`);
  101 | 
  102 |         await screenshotStep(page, '05-chat-typing');
  103 |         break;
  104 |       }
  105 |     }
  106 | 
  107 |     if (!chatFound) {
  108 |       console.log('  ℹ️  واجهة الدردشة محمية بتسجيل الدخول أو لم يُعثر عليها');
  109 |       test.info().annotations.push({
  110 |         type: 'chat-status',
  111 |         description: 'واجهة الدردشة تتطلب مصادقة',
  112 |       });
  113 |     }
  114 |   });
  115 | 
  116 |   // ─────────────────────────────────────────────
  117 |   test('فحص WebSocket / Polling للدردشة الحية', async ({ page }) => {
  118 |     const wsConnections = [];
  119 |     const xhrRequests = [];
  120 | 
  121 |     // مراقبة اتصالات WebSocket
  122 |     page.on('websocket', ws => {
  123 |       wsConnections.push(ws.url());
  124 |       console.log(`  🔌 WebSocket اتصال: ${ws.url()}`);
  125 | 
  126 |       ws.on('framesent', frame => {
  127 |         console.log(`    ↑ إرسال frame: ${frame.payload?.toString()?.slice(0, 100)}`);
  128 |       });
  129 |       ws.on('framereceived', frame => {
  130 |         console.log(`    ↓ استقبال frame: ${frame.payload?.toString()?.slice(0, 100)}`);
  131 |       });
  132 |     });
  133 | 
  134 |     // مراقبة طلبات الـ polling
  135 |     page.on('request', req => {
  136 |       if (req.url().includes('poll') || req.url().includes('realtime') || req.url().includes('stream')) {
  137 |         xhrRequests.push(req.url());
  138 |       }
  139 |     });
  140 | 
  141 |     await page.goto('https://malaf.pro/chat', { waitUntil: 'domcontentloaded' });
  142 |     await page.waitForTimeout(5000);
  143 | 
  144 |     console.log(`  📡 اتصالات WebSocket: ${wsConnections.length}`);
  145 |     console.log(`  🔄 طلبات Polling: ${xhrRequests.length}`);
  146 | 
  147 |     test.info().annotations.push({
  148 |       type: 'realtime-connections',
  149 |       description: `WebSocket: ${wsConnections.length} | Polling: ${xhrRequests.length} | URLs: ${wsConnections.join(', ')}`,
  150 |     });
  151 |   });
  152 | 
  153 |   // ─────────────────────────────────────────────
  154 |   // قسم ثاني: مكالمات الفيديو
  155 |   // ─────────────────────────────────────────────
  156 | 
  157 |   test('إيجاد ميزة مكالمة الفيديو', async ({ page }) => {
  158 |     const videoPaths = [
  159 |       '/video', '/video-call', '/call',
  160 |       '/office/video', '/consult/video',
  161 |       '/meeting', '/room',
  162 |     ];
  163 | 
  164 |     const found = [];
  165 |     for (const path of videoPaths) {
  166 |       const status = await checkPageStatus(page, `https://malaf.pro${path}`);
  167 |       if (status !== 404 && status !== 0) {
  168 |         found.push({ path, status });
  169 |         console.log(`  ✓ مسار الفيديو: ${path} → ${status}`);
  170 |       }
  171 |     }
  172 | 
  173 |     // البحث في الصفحة الرئيسية عن ميزة الفيديو
  174 |     await page.goto('https://malaf.pro');
  175 |     await waitForPageReady(page);
  176 | 
  177 |     const videoElements = await page.locator(
  178 |       'a:has-text("فيديو"), a:has-text("video"), a:has-text("مكالمة"), button:has-text("اتصال"), [href*="video"], [href*="call"]'
  179 |     ).count();
  180 | 
  181 |     console.log(`  📹 روابط الفيديو في الصفحة الرئيسية: ${videoElements}`);
  182 | 
  183 |     test.info().annotations.push({
  184 |       type: 'video-call-feature',
  185 |       description: found.length > 0
  186 |         ? `مسارات فيديو: ${found.map(f => f.path).join(', ')}`
  187 |         : `⚠️ لا يوجد مسار فيديو مباشر | روابط في الرئيسية: ${videoElements}`,
  188 |     });
  189 |   });
  190 | 
  191 |   // ─────────────────────────────────────────────
  192 |   test('فحص أذونات الكاميرا والمايكروفون', async ({ page, context }) => {
  193 |     // منح أذونات وهمية للاختبار
> 194 |     await context.grantPermissions(['camera', 'microphone']);
      |                   ^ Error: browserContext.grantPermissions: Unknown permission: camera
  195 | 
  196 |     const videoPaths = ['/video-call', '/call', '/video', '/meeting', '/room'];
  197 |     let videoPageFound = false;
  198 | 
  199 |     for (const path of videoPaths) {
  200 |       await page.goto(`https://malaf.pro${path}`, { waitUntil: 'domcontentloaded' });
  201 |       await waitForPageReady(page).catch(() => {});
  202 | 
  203 |       if (!page.url().includes('404') && !page.url().includes('login')) {
  204 |         videoPageFound = true;
  205 |         console.log(`  ✓ وُجدت صفحة فيديو: ${path}`);
  206 |         await screenshotStep(page, '05-video-call-page');
  207 | 
  208 |         // تحقق من وجود عناصر الفيديو
  209 |         const videoEl = page.locator('video, [class*="video-player"], [class*="webcam"]').first();
  210 |         const hasVideo = await videoEl.isVisible().catch(() => false);
  211 | 
  212 |         // تحقق من أزرار التحكم
  213 |         const muteBtn = page.locator(
  214 |           'button[aria-label*="مايكروفون"], button[aria-label*="صوت"], button:has-text("كتم"), [class*="mute"]'
  215 |         ).first();
  216 |         const hasMute = await muteBtn.isVisible().catch(() => false);
  217 | 
  218 |         const cameraBtn = page.locator(
  219 |           'button[aria-label*="كاميرا"], button:has-text("كاميرا"), [class*="camera"]'
  220 |         ).first();
  221 |         const hasCamera = await cameraBtn.isVisible().catch(() => false);
  222 | 
  223 |         const endCallBtn = page.locator(
  224 |           'button[aria-label*="إنهاء"], button:has-text("إنهاء"), button:has-text("خروج"), [class*="end-call"]'
  225 |         ).first();
  226 |         const hasEndCall = await endCallBtn.isVisible().catch(() => false);
  227 | 
  228 |         console.log(`    🎥 عنصر الفيديو: ${hasVideo ? '✓' : '✗'}`);
  229 |         console.log(`    🎤 زر كتم الصوت: ${hasMute ? '✓' : '✗'}`);
  230 |         console.log(`    📷 زر الكاميرا: ${hasCamera ? '✓' : '✗'}`);
  231 |         console.log(`    📵 زر إنهاء المكالمة: ${hasEndCall ? '✓' : '✗'}`);
  232 | 
  233 |         test.info().annotations.push({
  234 |           type: 'video-ui-elements',
  235 |           description: `فيديو:${hasVideo} | كتم:${hasMute} | كاميرا:${hasCamera} | إنهاء:${hasEndCall}`,
  236 |         });
  237 |         break;
  238 |       }
  239 |     }
  240 | 
  241 |     if (!videoPageFound) {
  242 |       console.log('  ℹ️  صفحة مكالمة الفيديو محمية أو غير متاحة للعموم');
  243 |       test.info().annotations.push({
  244 |         type: 'video-status',
  245 |         description: 'مكالمة الفيديو تتطلب مصادقة أو رابط جلسة خاص',
  246 |       });
  247 |     }
  248 |   });
  249 | 
  250 |   // ─────────────────────────────────────────────
  251 |   test('فحص دعم WebRTC لمكالمات الفيديو', async ({ page }) => {
  252 |     await page.goto('https://malaf.pro');
  253 | 
  254 |     // فحص دعم WebRTC في المتصفح
  255 |     const webRTCSupport = await page.evaluate(() => {
  256 |       return {
  257 |         RTCPeerConnection: typeof RTCPeerConnection !== 'undefined',
  258 |         getUserMedia: typeof navigator.mediaDevices?.getUserMedia === 'function',
  259 |         RTCDataChannel: typeof RTCDataChannel !== 'undefined',
  260 |       };
  261 |     });
  262 | 
  263 |     console.log('  📡 دعم WebRTC:');
  264 |     console.log(`    RTCPeerConnection: ${webRTCSupport.RTCPeerConnection ? '✓' : '✗'}`);
  265 |     console.log(`    getUserMedia: ${webRTCSupport.getUserMedia ? '✓' : '✗'}`);
  266 |     console.log(`    RTCDataChannel: ${webRTCSupport.RTCDataChannel ? '✓' : '✗'}`);
  267 | 
  268 |     // فحص مكتبات الفيديو المُحمَّلة في المنصة
  269 |     const videoLibraries = await page.evaluate(() => {
  270 |       return {
  271 |         agora: typeof AgoraRTC !== 'undefined',
  272 |         twilio: typeof Twilio !== 'undefined',
  273 |         daily: typeof DailyIframe !== 'undefined',
  274 |         jitsi: typeof JitsiMeetExternalAPI !== 'undefined',
  275 |         zoom: typeof ZoomMtg !== 'undefined',
  276 |         webRTCAdapter: typeof adapter !== 'undefined',
  277 |       };
  278 |     });
  279 | 
  280 |     const detectedLibs = Object.entries(videoLibraries)
  281 |       .filter(([, v]) => v)
  282 |       .map(([k]) => k);
  283 | 
  284 |     console.log(`  📚 مكتبات الفيديو المكتشفة: ${detectedLibs.length > 0 ? detectedLibs.join(', ') : 'لا شيء مكتشف في الصفحة الرئيسية'}`);
  285 | 
  286 |     test.info().annotations.push({
  287 |       type: 'webrtc-support',
  288 |       description: `WebRTC: ${JSON.stringify(webRTCSupport)} | Libraries: ${detectedLibs.join(', ') || 'none detected'}`,
  289 |     });
  290 | 
  291 |     // WebRTC يجب أن يكون مدعوماً على الأقل
  292 |     expect(webRTCSupport.RTCPeerConnection, 'المتصفح لا يدعم WebRTC').toBe(true);
  293 |   });
  294 | 
```