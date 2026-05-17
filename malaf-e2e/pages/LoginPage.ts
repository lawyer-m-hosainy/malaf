import { Page } from '@playwright/test';

export class LoginPage {
  constructor(private page: Page) {}

  async navigate() {
    await this.page.goto('/login');
  }

  async login(email: string, pass: string) {
    // using aria-label / role / placeholder for accessibility and RTL resilience
    await this.page.getByPlaceholder(/البريد الإلكتروني/i).fill(email);
    await this.page.getByPlaceholder(/كلمة المرور/i).fill(pass);
    await this.page.getByRole('button', { name: /تسجيل الدخول/i }).click();
    await this.page.waitForURL('**/dashboard');
  }
}
