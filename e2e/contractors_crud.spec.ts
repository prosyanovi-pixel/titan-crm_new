import { test, expect } from '@playwright/test';

test.describe('Contractors CRUD & Validation', () => {
  const uniqueId = Date.now();
  const contractorName = `Test Enterprise ${uniqueId}`;
  const inn = '1234567890';

  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('#identifier', 'admin');
    await page.fill('#password', 'password123');
    await page.click('button[type="submit"]');
    await expect(page.getByRole('heading', { name: 'Дашборд' })).toBeVisible({ timeout: 10000 });
  });

  test('should create, update and delete a contractor', async ({ page }) => {
    // 1. Создание
    await page.goto('/contractors');
    await expect(page.getByRole('heading', { name: 'Контрагенты' })).toBeVisible();
    
    await page.click('button:has-text("Новый клиент")');
    
    const sheet = page.locator('[role="dialog"]');
    await expect(sheet).toBeVisible();

    const innInputCreation = sheet.locator('input[placeholder*="ИНН"]');
    await innInputCreation.fill(inn);
    
    const nameInput = sheet.locator('input[placeholder*="Название"]');
    await nameInput.fill(contractorName);
    
    const saveButton = sheet.locator('button:has-text("Сохранить изменения")');
    await expect(saveButton).toBeEnabled();
    
    await Promise.all([
        page.waitForResponse(res => res.url().includes('/api/contractors') && res.request().method() === 'POST'),
        saveButton.click()
    ]);
    
    await expect(sheet).not.toBeVisible();
    
    // Проверка появления в списке
    const searchInput = page.locator('input[placeholder*="Поиск"]');
    await searchInput.fill(contractorName);
    await page.waitForTimeout(2000); 
    
    const row = page.locator('table tbody tr').filter({ hasText: contractorName });
    await expect(row).toBeVisible();

    // 2. Редактирование
    await row.locator('td:nth-child(2)').click();
    await expect(sheet).toBeVisible();
    await expect(sheet.locator('span.font-bold').filter({ hasText: contractorName }).first()).toBeVisible({ timeout: 10000 });

    const innRow = sheet.locator('div.group').filter({ has: page.locator('div', { hasText: /^ИНН$/ }) }).first();
    await expect(innRow).toBeVisible();
    
    if (!await innRow.locator('input').isVisible()) {
        await innRow.getByRole('button', { name: /Редактировать|Edit/i }).click();
    }
    
    const innInputDetails = innRow.locator('input');
    await innInputDetails.fill('1234500000'); 
    
    const detailSaveBtn = sheet.locator('button:has-text("Сохранить изменения")');
    await Promise.all([
        page.waitForResponse(res => res.url().includes('/api/contractors') && res.request().method() === 'PUT'),
        detailSaveBtn.click()
    ]);
    
    await expect(sheet).not.toBeVisible();
    await page.waitForTimeout(1000); 
    await expect(page.locator('table')).toContainText('1234500000');

    // 3. Удаление через Quick Action в таблице
    await searchInput.fill(contractorName);
    await page.waitForTimeout(500);
    const deleteRow = page.locator('table tbody tr').filter({ hasText: contractorName });
    
    // Кликаем на меню многоточие (последняя колонка)
    await deleteRow.locator('button[aria-haspopup="menu"]').click();
    
    // Ждем появления меню и кликаем Удалить
    const deleteMenuItem = page.locator('div[role="menuitem"]:has-text("Удалить")');
    await deleteMenuItem.waitFor({ state: 'visible' });
    await deleteMenuItem.click();
    
    // Подтверждение удаления (AlertDialog)
    const confirmButton = page.locator('button:has-text("Подтвердить")');
    await confirmButton.waitFor({ state: 'visible', timeout: 5000 });
    await confirmButton.click();
    
    await page.waitForResponse(res => res.url().includes('/api/contractors') && res.request().method() === 'DELETE');
    await page.waitForTimeout(1000); 
    
    await searchInput.fill(contractorName);
    await page.waitForTimeout(500);
    await expect(page.locator('table')).not.toContainText(contractorName);
  });

  test('should check dropdowns and tabs in contractor sheet', async ({ page }) => {
    await page.goto('/contractors');
    await page.click('button:has-text("Новый клиент")');
    
    const sheet = page.locator('[role="dialog"]');
    await expect(sheet).toBeVisible();

    const sections = [/Общая информация/i, /Банковские реквизиты/i, /Заметки/i];
    for (const section of sections) {
        await expect(sheet.getByText(section).first()).toBeVisible();
    }
    
    await page.keyboard.press('Escape');
    await expect(sheet).not.toBeVisible();
    
    const firstRow = page.locator('table tbody tr').first();
    if (await firstRow.isVisible()) {
        await firstRow.locator('td:nth-child(2)').click();
        await expect(sheet).toBeVisible();
        await page.waitForTimeout(1000); 
        
        const tabs = [/Карточка/i, /Контакты/i, /Активность/i];
        for (const tabRegex of tabs) {
            const tabTrigger = sheet.getByRole('tab').filter({ name: tabRegex }).first();
            await tabTrigger.click();
            await expect(tabTrigger).toHaveAttribute('data-state', 'active');
        }
    }
  });
});