import { Page, expect } from '@playwright/test';

export class AdminPaymentsPage {
  constructor(private page: Page) {}

  async navigate() {
    await this.page.goto('/admin/payments');
  }

  async approvePayment(transferReference: string) {
    const row = this.page.locator(`tr:has-text("${transferReference}")`);
    await row.getByRole('button', { name: /موافقة/i }).click();
    
    // Verify it disappears from pending or status changes
    await expect(row.getByText(/مكتمل/i)).toBeVisible();
  }
}
