import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { AdminPaymentsPage } from '../pages/AdminPaymentsPage';
import { TEST_DATA } from '../fixtures/testData';

test.describe('JOURNEY 4 — Admin Manual Payment Approval', () => {
  test('Admin approves payment and subscription upgrades', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const paymentsPage = new AdminPaymentsPage(page);

    // 1. Login as admin
    await loginPage.navigate();
    await loginPage.login(TEST_DATA.accounts.admin.email, TEST_DATA.accounts.admin.password);

    // 2. Go to pending payments list and approve
    await paymentsPage.navigate();
    await paymentsPage.approvePayment(TEST_DATA.transferReference);

    // 3. Verify firm subscription upgraded (Mock logic assumption, can verify via API or UI)
    // In this flow, we will verify the lawyer can now access new features
    await page.context().clearCookies();
    await loginPage.navigate();
    await loginPage.login(TEST_DATA.accounts.lawyer.email, TEST_DATA.accounts.lawyer.password);
    
    // Attempt to access AI Assistant (Assuming it's a premium feature unlocked)
    await page.getByTestId('nav-ai-assistant').click();
    
    // Should NOT see upgrade prompt anymore
    const upgradePrompt = page.locator('text=الترقية مطلوبة');
    await expect(upgradePrompt).toHaveCount(0);
    
    // Should see AI chat input
    const aiInput = page.getByTestId('ai-chat-input');
    await expect(aiInput).toBeVisible();
  });
});
