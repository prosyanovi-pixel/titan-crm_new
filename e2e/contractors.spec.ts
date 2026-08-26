import { test, expect } from '@playwright/test';

test.describe('Contractors Module', () => {
  test.beforeEach(async ({ page }) => {
    // Логинимся
    await page.goto('/login');
    await page.fill('#identifier', 'admin');
    await page.fill('#password', 'password123');
    await page.click('button[type="submit"]');
    await expect(page.getByRole('heading', { name: 'Дашборд' })).toBeVisible({ timeout: 10000 });
  });

  test('view contractors list', async ({ page }) => {
    await page.goto('/contractors');
    await expect(page.getByRole('heading', { name: 'Контрагенты' })).toBeVisible({ timeout: 10000 });
    
    // Проверяем наличие таблицы
    const contractorsTable = page.locator('table');
    await expect(contractorsTable).toBeVisible();
    
    // Проверяем заголовки
    const headers = ['Название', 'ИНН', 'Статус'];
    for (const header of headers) {
        await expect(contractorsTable).toContainText(header);
    }
  });

  test('search contractors', async ({ page }) => {
    await page.goto('/contractors');
    
    const searchInput = page.locator('input[placeholder*="Поиск"]');
    await expect(searchInput).toBeVisible();
    
    await searchInput.fill('СИБУР');
    await page.waitForTimeout(1000); // Клиентская фильтрация
    
    // Если СИБУР есть в базе, он должен быть виден. Если нет - "Нет данных"
    const table = page.locator('table');
    const text = await table.textContent();
    expect(text).toMatch(/СИБУР|Нет данных/i);
  });

  test('create new contractor (form validation)', async ({ page }) => {
    await page.goto('/contractors');
    
    await page.click('button:has-text("Новый клиент")');
    
    const sheet = page.locator('[role="dialog"]');
    await expect(sheet).toBeVisible();
    
    // Пытаемся сохранить пустую форму
    const saveButton = sheet.locator('button:has-text("Сохранить")');
    // В текущей реализации кнопка может быть disabled если name пустое
    const isDisabled = await saveButton.isDisabled();
    
    if (!isDisabled) {
        await saveButton.click();
        // Проверяем наличие ошибки или что окно не закрылось
        await expect(sheet).toBeVisible();
    } else {
        console.log('✓ Кнопка сохранения заблокирована для пустой формы');
    }
    
    // Заполняем имя и проверяем что кнопка стала активной
    await sheet.locator('input[placeholder*="Название"]').first().fill('Test Enterprise');
    await expect(saveButton).toBeEnabled();
    
    await page.keyboard.press('Escape');
    await expect(sheet).not.toBeVisible();
  });

  test('view contractor details', async ({ page }) => {
    await page.goto('/contractors');
    
    // Ждем загрузки данных
    await expect(page.locator('table tbody tr').first()).toBeVisible({ timeout: 10000 });
    
    // Кликаем по первому контрагенту (имя во второй колонке)
    const firstContractor = page.locator('table tbody tr td:nth-child(2)').first();
    const name = await firstContractor.textContent();
    
    await firstContractor.click();
    
    const sheet = page.locator('[role="dialog"]');
    await expect(sheet).toBeVisible();
    
    // Проверяем что имя в заголовке совпадает
    await expect(sheet.locator('span.font-bold').first()).toContainText(name || '');
  });
});