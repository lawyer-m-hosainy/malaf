import { Page, expect } from '@playwright/test';

export class CasesPage {
  constructor(private page: Page) {}

  async createCase(clientName: string, title: string, court: string) {
    await this.page.getByTestId('add-case-btn').click();
    
    // Select Client
    await this.page.getByTestId('client-select').click();
    await this.page.getByRole('option', { name: clientName }).click();

    await this.page.getByTestId('case-title-input').fill(title);
    await this.page.getByTestId('case-court-input').fill(court);
    
    // Assign to a lawyer (could be dynamic)
    await this.page.getByTestId('assign-lawyer-select').click();
    // Assuming we pick the first lawyer available
    await this.page.getByRole('option').first().click();

    await this.page.getByTestId('save-case-btn').click();
    await this.page.waitForSelector(`text=${title}`);
  }

  async verifyCaseExists(title: string) {
    const caseCard = this.page.locator(`text=${title}`);
    await expect(caseCard).toBeVisible();
  }
}
