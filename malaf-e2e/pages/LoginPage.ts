import { Page } from '@playwright/test';

export class LoginPage {
  constructor(private page: Page) {}

  async navigate() {
    await this.page.goto('/login');
  }

  async login(email: string, pass: string) {
    // Use getByRole or getByPlaceholder based on actual DOM snapshot
    await this.page.getByRole('textbox', { name: /البريد الإلكتروني/i }).fill(email);
    // Password fields are usually not 'textbox' role, so we use getByLabel or generic locator
    await this.page.locator('input[type="password"], input[placeholder*="كلمة المرور"]').first().fill(pass);
    // Use exact: true to avoid clicking 'تسجيل الدخول باستخدام Google'
    await this.page.getByRole('button', { name: 'تسجيل الدخول', exact: true }).click();
    await this.page.waitForURL('**/dashboard');
  }
}
