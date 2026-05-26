import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { DashboardPage } from '../pages/DashboardPage';
import { ClientsPage } from '../pages/ClientsPage';
import { CasesPage } from '../pages/CasesPage';
import { TEST_DATA } from '../fixtures/testData';

test.describe('JOURNEY 1 — Secretary Daily Workflow (Happy Path)', () => {
  test('Secretary adds a client and creates a case assigned to a lawyer', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const dashboardPage = new DashboardPage(page);
    const clientsPage = new ClientsPage(page);
    const casesPage = new CasesPage(page);

    // 1. Login as secretary
    await loginPage.navigate();
    await loginPage.login(TEST_DATA.accounts.secretary.email, TEST_DATA.accounts.secretary.password);

    // 2. Add new client
    await dashboardPage.navigateToClients();
    await clientsPage.addClient(TEST_DATA.clientName, TEST_DATA.nationalId);

    // 3. Create new case
    await dashboardPage.navigateToCases();
    await casesPage.createCase(TEST_DATA.clientName, TEST_DATA.caseTitle, TEST_DATA.court);

    // 4. Verify case appears (Login as Lawyer to verify)
    // Clear cookies/storage to simulate logout and fresh login
    await page.context().clearCookies();
    await loginPage.navigate();
    await loginPage.login(TEST_DATA.accounts.lawyer.email, TEST_DATA.accounts.lawyer.password);
    
    await dashboardPage.navigateToCases();
    await casesPage.verifyCaseExists(TEST_DATA.caseTitle);
  });
});
