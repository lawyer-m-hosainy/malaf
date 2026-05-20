// tests/04-ai-agents.spec.js
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// الاختبار الرابع: وكلاء الذكاء الاصطناعي
// هل الردود منطقية ومتوافقة مع أسئلة المستخدم؟
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const { test, expect } = require('@playwright/test');
const {
  AI_TEST_QUESTIONS,
  waitForPageReady,
  attachConsoleMonitor,
  screenshotStep,
} = require('../helpers/test-helpers');

// ─────────────────────────────────────────────
// دالة: إيجاد واجهة الدردشة في الصفحة
// ─────────────────────────────────────────────
async function findChatInterface(page) {
  const chatSelectors = [
    'textarea[placeholder*="اكتب"], textarea[placeholder*="رسالة"], textarea[placeholder*="سؤال"]',
    'input[placeholder*="اكتب"], input[placeholder*="رسالة"]',
    '[class*="chat-input"] textarea',
    '[class*="message-input"] textarea',
    '[data-testid*="chat"] textarea',
    'textarea',
  ];

  for (const sel of chatSelectors) {
    const el = page.locator(sel).first();
    if (await el.isVisible().catch(() => false)) {
      return el;
    }
  }
  return null;
}

// ─────────────────────────────────────────────
// دالة: إرسال رسالة وانتظار الرد
// ─────────────────────────────────────────────
async function sendChatMessage(page, message, timeoutMs = 30000) {
  const chatInput = await findChatInterface(page);
  if (!chatInput) return { sent: false, response: null };

  await chatInput.fill(message);

  // إرسال بـ Enter أو زر الإرسال
  const sendBtn = page.locator(
    'button[type="submit"], button:has-text("إرسال"), button:has-text("Send"), [aria-label*="إرسال"], [aria-label*="send"]'
  ).first();

  if (await sendBtn.isVisible().catch(() => false)) {
    await sendBtn.click();
  } else {
    await chatInput.press('Enter');
  }

  // انتظار ظهور الرد
  const start = Date.now();
  let responseText = null;

  while (Date.now() - start < timeoutMs) {
    await page.waitForTimeout(2000);

    // البحث عن آخر رسالة من الوكيل
    const aiMessages = page.locator(
      '[class*="ai-message"], [class*="bot-message"], [class*="assistant"], [data-role="assistant"], [class*="response"]'
    );
    const count = await aiMessages.count();

    if (count > 0) {
      responseText = await aiMessages.last().innerText().catch(() => '');
      if (responseText && responseText.length > 10) break;
    }

    // إذا لم يُعثر على رسائل واضحة، ابحث عن أي نص ظهر بعد الرسالة
    const allMessages = page.locator('[class*="message"], [class*="bubble"]');
    const msgCount = await allMessages.count();
    if (msgCount > 1) {
      responseText = await allMessages.last().innerText().catch(() => '');
      if (responseText && responseText.length > 10) break;
    }
  }

  return { sent: true, response: responseText, responseTime: Date.now() - start };
}

// ─────────────────────────────────────────────
// دالة: تقييم جودة الرد
// ─────────────────────────────────────────────
function evaluateResponse(question, response, expectAnswer) {
  if (!response) {
    return {
      quality: 'لا يوجد رد',
      score: 0,
      issues: ['الوكيل لم يرد أبداً'],
    };
  }

  const issues = [];
  const positives = [];
  let score = 0;

  // طول الرد
  if (response.length < 10) {
    issues.push('الرد قصير جداً (أقل من 10 حروف)');
  } else if (response.length > 20) {
    score += 20;
    positives.push('الرد له طول معقول');
  }

  // هل الرد باللغة العربية؟ (إذا السؤال عربي)
  const arabicChars = (response.match(/[\u0600-\u06FF]/g) || []).length;
  const isArabicQuestion = /[\u0600-\u06FF]/.test(question);
  if (isArabicQuestion && arabicChars > 5) {
    score += 20;
    positives.push('الرد باللغة العربية ✓');
  } else if (isArabicQuestion && arabicChars < 5) {
    issues.push('السؤال عربي لكن الرد ليس عربياً!');
  }

  // هل الرد يحتوي على مصطلحات قانونية ذات صلة؟
  const legalTerms = ['قانون', 'محكمة', 'دعوى', 'حق', 'إجراء', 'عقد', 'نظام', 'لائحة', 'حكم', 'طعن'];
  const hasLegalTerms = legalTerms.some(t => response.includes(t));
  if (hasLegalTerms && expectAnswer) {
    score += 30;
    positives.push('يحتوي على مصطلحات قانونية ✓');
  }

  // هل الرد يحتوي على رسالة خطأ أو استثناء؟
  const errorPatterns = ['error', 'exception', 'undefined', 'null', 'NaN', '500', '404'];
  const hasError = errorPatterns.some(e => response.toLowerCase().includes(e));
  if (hasError) {
    issues.push('يبدو أن الرد يحتوي على رسالة خطأ تقنية');
    score -= 30;
  }

  // هل الرد يُشير للأسئلة خارج النطاق بشكل صحيح؟
  if (!expectAnswer) {
    const outOfScopeIndicators = ['لا أستطيع', 'خارج', 'اختصاص', 'يرجى', 'للأسئلة القانونية'];
    const handled = outOfScopeIndicators.some(i => response.includes(i));
    if (handled) {
      score += 30;
      positives.push('تعامل صحيح مع سؤال خارج النطاق ✓');
    } else {
      issues.push('أجاب على سؤال خارج النطاق القانوني (قد يكون مشكلة)');
    }
  }

  // تقييم نهائي
  score = Math.max(0, Math.min(100, score));
  const quality = score >= 70 ? 'ممتاز' : score >= 40 ? 'مقبول' : 'يحتاج مراجعة';

  return { quality, score, issues, positives };
}

test.describe('اختبار وكلاء الذكاء الاصطناعي', () => {
  let aiTestResults = [];

  test.beforeEach(async ({ page }) => {
    attachConsoleMonitor(page, []);
  });

  // ─────────────────────────────────────────────
  test('إيجاد صفحة وكيل الذكاء الاصطناعي', async ({ page }) => {
    const aiPaths = [
      '/ai-agent', '/agent', '/chat', '/assistant',
      '/office/ai', '/ai', '/bot', '/malaf-ai',
      '/office/chat', '/legal-assistant',
    ];

    const found = [];
    for (const path of aiPaths) {
      await page.goto(`https://malaf.pro${path}`, { waitUntil: 'domcontentloaded' });
      await waitForPageReady(page).catch(() => {});

      const url = page.url();
      const isOnPage = !url.includes('login') && !url.includes('404');
      const hasChat = await findChatInterface(page) !== null;

      if (isOnPage || hasChat) {
        found.push({ path, url, hasChat });
        console.log(`  ✓ وُجدت واجهة ذكاء اصطناعي في: ${path} (دردشة: ${hasChat})`);
        await screenshotStep(page, `04-ai-agent-${path.replace('/', '')}`);
      }
    }

    test.info().annotations.push({
      type: 'ai-agent-pages',
      description: found.length > 0
        ? found.map(f => `${f.path} (chat:${f.hasChat})`).join(', ')
        : '⚠️ لم يُعثر على صفحة وكيل ذكاء اصطناعي',
    });

    if (found.length === 0) {
      console.log('  ⚠️  لم يُعثر على مسار واضح لوكيل الذكاء الاصطناعي');
      console.log('  ℹ️  قد يكون محمياً بتسجيل الدخول أو بمسار غير متوقع');
    }
  });

  // ─────────────────────────────────────────────
  test('اختبار API وكيل الذكاء الاصطناعي مباشرةً', async ({ page }) => {
    // فحص نقاط API المحتملة للوكيل
    const apiEndpoints = [
      '/api/chat',
      '/api/ai/chat',
      '/api/agent/message',
      '/api/v1/chat',
      '/api/legal-ai',
    ];

    for (const endpoint of apiEndpoints) {
      const response = await page.request.post(`https://malaf.pro${endpoint}`, {
        data: { message: 'ما هي خدماتكم؟' },
        headers: { 'Content-Type': 'application/json' },
        timeout: 10000,
      }).catch(() => null);

      if (response) {
        const status = response.status();
        console.log(`  ${status === 200 ? '✓' : '✗'} POST ${endpoint} → ${status}`);

        if (status === 200) {
          const body = await response.text().catch(() => '{}');
          console.log(`    📥 رد API (أول 200 حرف): ${body.slice(0, 200)}`);
          test.info().annotations.push({
            type: 'ai-api-endpoint',
            description: `${endpoint}: ${status} — ${body.slice(0, 100)}`,
          });
        }
      }
    }
  });

  // ─────────────────────────────────────────────
  test('اختبار أسئلة قانونية على وكيل الذكاء الاصطناعي', async ({ page }) => {
    // البحث عن صفحة الوكيل
    let agentPage = null;
    const pathsToTry = ['/chat', '/ai-agent', '/agent', '/assistant', '/ai'];

    for (const path of pathsToTry) {
      await page.goto(`https://malaf.pro${path}`, { waitUntil: 'domcontentloaded' });
      await waitForPageReady(page).catch(() => {});

      if (!page.url().includes('login') && !page.url().includes('404')) {
        const chatInput = await findChatInterface(page);
        if (chatInput) {
          agentPage = path;
          break;
        }
      }
    }

    if (!agentPage) {
      console.log('  ℹ️  لم يُعثر على واجهة دردشة متاحة دون تسجيل دخول');
      console.log('  ℹ️  سيتم اختبار API مباشرةً...');

      // اختبار بديل: إرسال طلبات HTTP مباشرة للـ API
      for (const testCase of AI_TEST_QUESTIONS.slice(0, 3)) {
        const response = await page.request.post('https://malaf.pro/api/chat', {
          data: { message: testCase.q, role: 'user' },
          headers: { 'Content-Type': 'application/json' },
          timeout: 15000,
        }).catch(() => null);

        if (response) {
          const status = response.status();
          const body = await response.text().catch(() => '');
          const evaluation = evaluateResponse(testCase.q, body, testCase.expectAnswer);

          aiTestResults.push({
            question: testCase.q,
            category: testCase.category,
            status,
            response: body.slice(0, 200),
            evaluation,
          });

          console.log(`\n  📤 السؤال: ${testCase.q.slice(0, 50)}...`);
          console.log(`  📥 الحالة: ${status}`);
          console.log(`  🎯 التقييم: ${evaluation.quality} (${evaluation.score}/100)`);
        }
      }

      test.info().annotations.push({
        type: 'ai-test-results',
        description: JSON.stringify(aiTestResults),
      });
      return;
    }

    // اختبار الأسئلة على الواجهة
    console.log(`  ✓ تم العثور على واجهة الدردشة في: ${agentPage}`);

    for (const testCase of AI_TEST_QUESTIONS) {
      console.log(`\n  📤 الفئة: ${testCase.category}`);
      console.log(`  📤 السؤال: "${testCase.q}"`);

      if (testCase.q === '') {
        // اختبار الحقل الفارغ
        const chatInput = await findChatInterface(page);
        if (chatInput) {
          await chatInput.fill('');
          const sendBtn = page.locator('button[type="submit"]').first();
          if (await sendBtn.isVisible().catch(() => false)) {
            const isDisabled = await sendBtn.isDisabled().catch(() => false);
            console.log(`  ${isDisabled ? '✓' : '⚠️'} زر الإرسال ${isDisabled ? 'معطّل' : 'مُفعَّل'} عند رسالة فارغة`);
          }
        }
        continue;
      }

      const result = await sendChatMessage(page, testCase.q);
      const evaluation = evaluateResponse(testCase.q, result.response, testCase.expectAnswer);

      console.log(`  📥 الرد (أول 100 حرف): ${result.response?.slice(0, 100) || 'لا يوجد رد'}`);
      console.log(`  ⏱  زمن الرد: ${result.responseTime}ms`);
      console.log(`  🎯 التقييم: ${evaluation.quality} (${evaluation.score}/100)`);

      if (evaluation.issues.length > 0) {
        console.log(`  ⚠️  مشاكل: ${evaluation.issues.join(', ')}`);
      }

      aiTestResults.push({
        question: testCase.q,
        category: testCase.category,
        response: result.response?.slice(0, 200),
        responseTime: result.responseTime,
        evaluation,
      });

      await screenshotStep(page, `04-ai-question-${testCase.category}`);

      // انتظار قصير بين الأسئلة
      await page.waitForTimeout(2000);
    }

    // تلخيص نتائج وكيل الذكاء الاصطناعي
    const avgScore = aiTestResults.reduce((sum, r) => sum + (r.evaluation?.score || 0), 0)
      / Math.max(aiTestResults.length, 1);

    console.log(`\n  📊 متوسط جودة ردود الوكيل: ${avgScore.toFixed(1)}/100`);

    test.info().annotations.push({
      type: 'ai-overall-score',
      description: `متوسط الجودة: ${avgScore.toFixed(1)}/100 | عدد الأسئلة: ${aiTestResults.length}`,
    });

    // يجب أن يكون المتوسط على الأقل 30/100
    expect(
      avgScore,
      `جودة ردود الوكيل منخفضة جداً: ${avgScore.toFixed(1)}/100`
    ).toBeGreaterThanOrEqual(30);
  });

  // ─────────────────────────────────────────────
  test('التحقق من سرعة استجابة وكيل الذكاء الاصطناعي', async ({ page }) => {
    // قياس زمن استجابة API الوكيل
    const testMsg = 'ما هي خدماتكم القانونية؟';
    const start = Date.now();

    const response = await page.request.post('https://malaf.pro/api/chat', {
      data: { message: testMsg },
      headers: { 'Content-Type': 'application/json' },
      timeout: 30000,
    }).catch(() => null);

    const responseTime = Date.now() - start;

    if (response) {
      console.log(`  ⏱  زمن الاستجابة: ${responseTime}ms`);
      if (responseTime > 10000) {
        console.warn('  ⚠️  الوكيل بطيء جداً (أكثر من 10 ثوان)');
      } else if (responseTime > 5000) {
        console.warn('  ⚠️  الوكيل بطيء نوعاً ما (5-10 ثوان)');
      } else {
        console.log('  ✓ زمن الاستجابة جيد (أقل من 5 ثوان)');
      }

      test.info().annotations.push({
        type: 'ai-response-time',
        description: `زمن الاستجابة: ${responseTime}ms`,
      });
    } else {
      console.log('  ℹ️  لم يُعثر على نقطة API للوكيل');
    }
  });
});
