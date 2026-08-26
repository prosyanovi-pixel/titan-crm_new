import { test, expect } from '@playwright/test';

test.describe('Contractors Full Cycle (Contacts & Banks)', () => {
  const uniqueId = Date.now();
  const contractorName = `Full Cycle Corp ${uniqueId}`;

  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.fill('#identifier', 'admin');
    await page.fill('#password', 'password123');
    await page.click('button[type="submit"]');
    await expect(page.getByRole('heading', { name: 'Дашборд' })).toBeVisible({ timeout: 10000 });
  });

  test('should manage contacts and bank accounts', async ({ page }) => {
    await page.goto('/contractors');
    
    // 1. Create a contractor
    await page.click('button:has-text("Новый клиент")');
    const sheet = page.locator('[role="dialog"]');
    await expect(sheet).toBeVisible();
    
    await sheet.locator('input[placeholder*="Название"]').first().fill(contractorName);
    
    await Promise.all([
        page.waitForResponse(res => res.url().includes('/api/contractors') && res.request().method() === 'POST'),
        sheet.locator('button:has-text("Сохранить")').click()
    ]);
    
    await expect(sheet).not.toBeVisible();

    // 2. Open the contractor
    await page.fill('input[placeholder*="Поиск"]', contractorName);
    await page.waitForTimeout(1000);
    const row = page.locator('table tbody tr').filter({ hasText: contractorName });
    await row.locator('td:nth-child(2)').click();
    await expect(sheet).toBeVisible();
    await expect(sheet.locator('span.font-bold').first()).toContainText(contractorName);

    // 3. Manage Contacts
    await sheet.getByRole('tab', { name: /Контакты/i }).click();
    
    // Add Contact
    await sheet.locator('button:has-text("Добавить контакт")').click();
    const contactDialog = page.locator('[role="dialog"]').last();
    await contactDialog.locator('input[placeholder*="ФИО"]').fill('Иван Петров');
    await contactDialog.locator('input[placeholder*="email"]').fill('ivan@test.ru');
    
    await Promise.all([
        page.waitForResponse(res => res.url().includes('/api/contractors/') && res.url().includes('/contacts')),
        contactDialog.locator('button:has-text("Сохранить"), button:has-text("Добавить")').click()
    ]);
    
    await expect(sheet.getByText('Иван Петров')).toBeVisible();

    // 4. Manage Bank Accounts
    await sheet.getByRole('tab', { name: /Карточка/i }).click();
    await sheet.locator('button:has-text("Добавить счет")').click();
    
    const bankDialog = page.locator('[role="dialog"]').last();
    await bankDialog.locator('div:has-text("БИК")').locator('input').first().fill('044525225');
    await bankDialog.locator('div:has-text("Банк")').locator('input').first().fill('ПАО СБЕРБАНК');
    await bankDialog.locator('div:has-text("Номер счета")').locator('input').first().fill('40702810123456789012');
    
    await Promise.all([
        page.waitForResponse(res => res.url().includes('/api/contractors/') && res.url().includes('/bank-accounts')),
        bankDialog.locator('button:has-text("Добавить"), button:has-text("Сохранить")').click()
    ]);
    
    await expect(sheet.getByText('ПАО СБЕРБАНК')).toBeVisible();

    // 5. Cleanup
    const deleteBtn = sheet.locator('footer button').filter({ hasText: /^Удалить$/ }).first();
    if (await deleteBtn.isVisible()) {
        await deleteBtn.click();
        const confirmButton = page.locator('button:has-text("Подтвердить")');
        await confirmButton.waitFor({ state: 'visible' });
        await confirmButton.click();
        await expect(sheet).not.toBeVisible();
    }
  });
});