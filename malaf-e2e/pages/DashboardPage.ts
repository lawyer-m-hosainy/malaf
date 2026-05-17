import { Page } from '@playwright/test';

export class DashboardPage {
  constructor(private page: Page) {}

  async navigateToClients() {
    await this.page.getByTestId('nav-clients').click();
  }

  async navigateToCases() {
    await this.page.getByTestId('nav-cases').click();
  }

  async navigateToPayments() {
    await this.page.getByTestId('nav-payments').click();
  }
}
