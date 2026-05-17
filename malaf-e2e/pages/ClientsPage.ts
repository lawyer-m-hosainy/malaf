import { Page } from '@playwright/test';

export class ClientsPage {
  constructor(private page: Page) {}

  async addClient(name: string, nationalId: string) {
    await this.page.getByTestId('add-client-btn').click();
    await this.page.getByTestId('client-name-input').fill(name);
    await this.page.getByTestId('client-national-id-input').fill(nationalId);
    await this.page.getByTestId('save-client-btn').click();
    
    // Assert client added successfully
    await this.page.waitForSelector(`text=${name}`);
  }
}
