import { test, expect } from '@playwright/test';

test.describe('Workflow Module', () => {
  test.beforeEach(async ({ page }) => {
    // Логинимся
    await page.goto('/login');
    await page.fill('#identifier', 'admin');
    await page.fill('#password', 'password123');
    await page.click('button[type="submit"]');
    await expect(page.getByRole('heading', { name: 'Дашборд' })).toBeVisible({ timeout: 10000 });
  });

  test('Create Workflow, Add Steps and Check History', async ({ page, request }) => {
    // 1. Создание процесса
    await page.goto('/workflows');
    await expect(page.getByRole('heading', { name: 'Процессы' })).toBeVisible();

    // Кликаем Создать процесс
    await page.click('button:has-text("Создать процесс")');
    
    // Ждем диалог
    const createDialog = page.locator('[role="dialog"]');
    await expect(createDialog).toBeVisible();
    
    // Заполняем форму
    const workflowName = `E2E Test Workflow ${Date.now()}`;
    await createDialog.locator('input[name="name"]').fill(workflowName);
    await createDialog.locator('input[name="description"]').fill('E2E Testing');
    
    // Ждем навигации после клика Создать
    await Promise.all([
        page.waitForURL(/\/workflows\/[0-9a-fA-F-]+\/builder/, { timeout: 10000 }),
        createDialog.locator('button:has-text("Создать")').click()
    ]);
    
    // Ищем кнопку сохранения или панель (просто чтобы убедиться, что мы в редакторе)
    await expect(page.getByRole('button', { name: 'Сохранить процесс' })).toBeVisible({ timeout: 10000 });

    // Симуляция триггеринга через API
    const url = page.url();
    const match = url.match(/\/workflows\/([0-9a-fA-F-]+)\/builder/);
    expect(match).not.toBeNull();
    const workflowId = match![1];

    // Мокаем ID админа
    const runResponse = await request.post(`/api/workflows/${workflowId}/run`, {
      headers: {
        'x-user-id': '00000000-0000-0000-0000-000000000001'
      },
      data: { dryRun: false }
    });
    expect(runResponse.ok()).toBeTruthy();

    // 2. История (History)
    await page.goto('/workflows');
    await expect(page.getByRole('heading', { name: 'Процессы' })).toBeVisible();
    
    // Находим наш созданный процесс и кликаем на историю
    const row = page.locator('tr').filter({ hasText: workflowName });
    await expect(row).toBeVisible();
    
    // Открываем меню
    await row.locator('.lucide-more-vertical').click();
    await page.click('div[role="menuitem"]:has-text("История запусков")');

    // 3. Открытие панели ExecutionHistorySheet
    const historySheet = page.locator('[role="dialog"]');
    await expect(historySheet).toBeVisible();
    await expect(historySheet.getByText('История запусков')).toBeVisible();

    // Проверяем наличие записей о выполнении
    // Кликаем по первой записи в истории
    const firstExecutionRecord = historySheet.locator('.cursor-pointer').first();
    await firstExecutionRecord.waitFor({ state: 'visible', timeout: 5000 });
    await firstExecutionRecord.click();

    // 4. Ошибки и контекст
    await expect(historySheet.getByText('Детали запуска')).toBeVisible({ timeout: 5000 });
    await expect(historySheet.getByText('Финальный контекст (Переменные)')).toBeVisible();
    
    // Закрываем историю
    await page.keyboard.press('Escape');
    await expect(historySheet).not.toBeVisible();
  });
});