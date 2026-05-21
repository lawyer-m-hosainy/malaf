import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { CasesPage } from '../pages/CasesPage';

test.describe('دورة حياة القضايا (Cases CRUD)', () => {
  let loginPage: LoginPage;
  let casesPage: CasesPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    casesPage = new CasesPage(page);
    await loginPage.navigate();
    await loginPage.login('test-lawyer@malaf.pro', 'TestPassword123!');
  });

  test('يجب أن يتمكن المستخدم من إضافة قضية جديدة', async ({ page }) => {
    // Generate a unique case number to avoid conflicts
    const uniqueNumber = `55-${Date.now().toString().slice(-4)}-ت`;
    const caseTitle = `قضية مطالبة مالية - اختبار ${Date.now()}`;

    // Navigate to cases page
    await page.getByRole('link', { name: 'القضايا', exact: true }).click();
    
    // We assume the CasesPage handles the creation
    await page.getByTestId('add-case-btn').click();
    
    // Fill the required fields
    // Assuming there's a client already, we just select the first one
    await page.getByTestId('client-select').selectOption({ index: 1 });
    await page.locator('input[placeholder*="مثلاً: 45-123-ت"]').fill(uniqueNumber);
    await page.getByTestId('case-title-input').fill(caseTitle);
    
    // Court selection (assuming CourtSelector exists)
    const courtCategorySelect = page.locator('select[title="التصنيف الأساسي"]');
    if (await courtCategorySelect.isVisible()) {
        await courtCategorySelect.selectOption({ label: 'تجاري' });
        await page.locator('select[title="نوع المحكمة"]').selectOption({ index: 1 });
        await page.locator('select[title="مقر المحكمة"]').selectOption({ index: 1 });
    }

    // Plaintiff and Defendant
    const roleSelect = page.locator('select[title="صفة الموكل"]');
    await roleSelect.selectOption('مدعي');
    await page.locator('input[placeholder="أسماء الخصوم"]').fill('شركة الاختبار المحدودة');

    await page.getByTestId('save-case-btn').click();

    // Verify success toast or case card appears
    await expect(page.locator('text=تم إضافة القضية بنجاح')).toBeVisible();
    await expect(page.locator(`text=${uniqueNumber}`)).toBeVisible();
  });

  test('يجب أن يمنع النظام تكرار القضايا بنفس الرقم', async ({ page }) => {
    // Navigate to cases page
    await page.getByRole('link', { name: 'القضايا', exact: true }).click();
    await page.getByTestId('add-case-btn').click();
    
    // Use an explicitly known existing number or intercept saving
    const duplicateNumber = '1-DUPLICATE-TEST';
    
    // Mock the cases store state to already have this case
    await page.evaluate(() => {
        window.localStorage.setItem('cases-storage', JSON.stringify({
            state: {
                cases: [{ id: '1-DUPLICATE-TEST', title: 'Existing Case' }]
            }
        }));
    });
    
    await page.reload();
    await page.getByRole('link', { name: 'القضايا', exact: true }).click();
    await page.getByTestId('add-case-btn').click();

    await page.getByTestId('client-select').selectOption({ index: 1 });
    await page.locator('input[placeholder*="مثلاً: 45-123-ت"]').fill(duplicateNumber);
    await page.getByTestId('case-title-input').fill('محاولة إضافة مكررة');
    await page.locator('input[placeholder="أسماء الخصوم"]').fill('شركة الخصم');
    
    await page.getByTestId('save-case-btn').click();

    // Verify that the duplicate warning appears
    await expect(page.locator('text=قضية مكررة: يوجد بالفعل قضية بنفس الرقم')).toBeVisible();
  });

});
