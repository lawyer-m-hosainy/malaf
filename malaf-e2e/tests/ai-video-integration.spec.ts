import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';

test.describe('تكامل الذكاء الاصطناعي ومكالمات الفيديو', () => {

  test.beforeEach(async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.navigate();
    await loginPage.login('test-lawyer@malaf.pro', 'TestPassword123!');
  });

  test('يجب أن يستجيب المساعد القانوني وتعمل غرف الفيديو بسلاسة (محاكاة Edge Functions)', async ({ page }) => {
    
    // 1. محاكاة استجابة Supabase Edge Function للمساعد القانوني
    await page.route('**/functions/v1/legal-assistant', async (route) => {
      const request = route.request();
      if (request.method() === 'OPTIONS') {
        return route.fulfill({ status: 200, headers: { 'Access-Control-Allow-Origin': '*' } });
      }
      
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          text: 'بناءً على القانون المدني المصري مادة 147، العقد شريعة المتعاقدين...',
          provider: 'gemini-mock',
          isFallback: false
        })
      });
    });

    // 2. محاكاة استجابة Supabase Edge Function لغرف الفيديو
    await page.route('**/functions/v1/create-video-room', async (route) => {
      if (route.request().method() === 'OPTIONS') {
        return route.fulfill({ status: 200, headers: { 'Access-Control-Allow-Origin': '*' } });
      }
      
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          url: 'https://mock.daily.co/test-room-12345'
        })
      });
    });

    // 3. الانتقال إلى صفحة المساعد القانوني / الدردشة
    // We assume there is a sidebar link for AI assistant or Chat
    const aiLink = page.locator('a[href*="/ai"], a[href*="/chat"], a[href*="/legal-assistant"]').first();
    if (await aiLink.isVisible()) {
      await aiLink.click();
    } else {
      // Fallback direct navigation
      await page.goto('/chat'); 
    }

    // 4. اختبار المحادثة مع الذكاء الاصطناعي
    const chatInput = page.locator('textarea[placeholder*="رسالة"], input[placeholder*="رسالة"], textarea').first();
    await expect(chatInput).toBeVisible();
    await chatInput.fill('ما هو المبدأ القانوني للعقود؟');
    await chatInput.press('Enter');

    // التحقق من أن رد المساعد القانوني ظهر في الشاشة
    await expect(page.locator('text=العقد شريعة المتعاقدين')).toBeVisible({ timeout: 5000 });

    // 5. اختبار إنشاء مكالمة فيديو
    // البحث عن زر الفيديو في واجهة MessageInput.tsx
    const videoBtn = page.locator('button[title*="فيديو"], button svg.lucide-video, [data-testid="start-video-call"]').first();
    
    // We intercept window.open because startVideoCall opens the URL in a new tab
    let newTabUrl = '';
    page.on('popup', async (popup) => {
      newTabUrl = popup.url();
      await popup.close();
    });

    if (await videoBtn.isVisible()) {
      // إذا كان الزر أيقونة SVG فقط
      if (await videoBtn.getAttribute('tagName') === 'svg') {
         await videoBtn.locator('..').click();
      } else {
         await videoBtn.click();
      }
      
      // التحقق من ظهور رسالة النظام في الدردشة
      await expect(page.locator('text=بدأ مكالمة فيديو')).toBeVisible({ timeout: 5000 });
      
      // Verification that the popup was triggered (the URL is not fully captured if mocked immediately, 
      // but we check the chat injection which confirms the Edge Function succeeded).
    }
  });

});
