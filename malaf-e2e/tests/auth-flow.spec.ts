import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';

test.describe('مسار المصادقة والتسجيل (Auth Flow)', () => {

  test('يجب أن يتمكن المستخدم من تسجيل الدخول بنجاح', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.navigate();
    
    // استخدام حساب وهمي مخصص للاختبارات فقط
    await loginPage.login('test-lawyer@malaf.pro', 'TestPassword123!');
    
    // التحقق من الانتقال إلى لوحة التحكم
    await expect(page).toHaveURL(/.*dashboard/);
    await expect(page.locator('text=لوحة التحكم')).toBeVisible();
  });

  test('يجب حظر الوصول إذا انتهت الفترة التجريبية (7 أيام)', async ({ page }) => {
    // محاكاة استجابة الخادم لتبدو وكأن الحساب منتهي الصلاحية
    await page.route('**/rest/v1/organizations*', async (route) => {
      const response = await route.fetch();
      const json = await response.json();
      
      // التلاعب بتاريخ الإنشاء لجعله أقدم من 7 أيام
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 10);
      
      if (Array.isArray(json) && json.length > 0) {
        json[0].created_at = oldDate.toISOString();
      }
      
      await route.fulfill({ json });
    });

    const loginPage = new LoginPage(page);
    await loginPage.navigate();
    await loginPage.login('test-lawyer@malaf.pro', 'TestPassword123!');
    
    // يجب أن تظهر شاشة القفل TrialExpiredLockScreen
    await expect(page.locator('text=انتهت الفترة التجريبية')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=ترقية الاشتراك')).toBeVisible();
    await expect(page.locator('text=تصدير بياناتي')).toBeVisible();
  });

});
