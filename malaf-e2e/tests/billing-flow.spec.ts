import { test, expect } from '@playwright/test';

test('Full Flow: Login -> Case -> ETA Invoice -> Audit Log', async ({ page }) => {
  // 1. تسجيل الدخول
  await page.goto('/login');
  await page.fill('input[name="email"]', 'lawyer@malaf.pro');
  await page.fill('input[name="password"]', 'SecurePass123!');
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL('/dashboard');

  // 2. فتح قضية جديدة
  await page.click('text=قضية جديدة');
  await page.fill('input[name="caseName"]', 'قضية تعويض تجاري');
  await page.click('button:has-text("حفظ")');
  await expect(page.locator('.toast-success')).toBeVisible();

  // 3. إصدار فاتورة ETA
  await page.click('text=الماليات');
  await page.click('text=إصدار فاتورة إلكترونية');
  await page.fill('input[name="amount"]', '10000');
  
  // التحقق التلقائي من الضريبة 14%
  await expect(page.locator('text=1400')).toBeVisible(); 
  await page.click('button:has-text("إرسال للضرائب")');
  await expect(page.locator('text=تم الاعتماد')).toBeVisible();

  // 4. التحقق من Audit Log
  await page.goto('/settings/audit');
  await expect(page.locator('text=إصدار فاتورة إلكترونية بقيمة 11400')).toBeVisible();
});
