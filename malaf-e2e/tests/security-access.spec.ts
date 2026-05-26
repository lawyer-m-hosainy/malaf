import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { TEST_DATA } from '../fixtures/testData';

test.describe('JOURNEY 3 — Security: Unauthorized Access Attempt', () => {
  test.beforeEach(async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.navigate();
    await loginPage.login(TEST_DATA.accounts.secretary.email, TEST_DATA.accounts.secretary.password);
  });

  test('Secretary cannot access admin payments URL directly', async ({ page }) => {
    // Attempt direct URL navigation
    await page.goto('/admin/payments');
    
    // Assert redirect to dashboard or unauth message
    // Never assert an error page to avoid info leaking
    const url = page.url();
    if (url.includes('/admin/payments')) {
      const unauthMessage = page.locator('text=غير مصرح');
      await expect(unauthMessage).toBeVisible();
    } else {
      expect(url).toContain('/dashboard');
    }
  });

  test('Cannot access cases from another firm via direct URL manipulation', async ({ page }) => {
    // Attempt direct URL to firm B's cases
    await page.goto(`/firms/${TEST_DATA.firmBTenantId}/cases`);
    
    const url = page.url();
    if (url.includes(`/firms/${TEST_DATA.firmBTenantId}/cases`)) {
      // Must return empty or "غير مصرح"
      const casesList = page.getByTestId('cases-list');
      // Assume empty means 0 case cards
      await expect(casesList.locator('.case-card')).toHaveCount(0);
    } else {
      // Safely redirected to root dashboard
      expect(url).toContain('/dashboard');
    }
  });

  test('Cannot access cases via URL parameter manipulation', async ({ page }) => {
    // Attempt URL param hack
    await page.goto(`/cases?tenant=${TEST_DATA.firmBTenantId}`);
    
    // Validate empty state or redirect
    const url = page.url();
    if (url.includes(`tenant=${TEST_DATA.firmBTenantId}`)) {
      const casesList = page.getByTestId('cases-list');
      await expect(casesList.locator('.case-card')).toHaveCount(0);
    } else {
      expect(url).toContain('/dashboard');
    }
  });
});
