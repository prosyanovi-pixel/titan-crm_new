import { test, expect } from '@playwright/test';

test.describe('Projects Module Complex Flow', () => {
  const uniqueId = Date.now();
  const projectName = `Test Project ${uniqueId}`;
  const stageName = `Test Stage ${uniqueId}`;
  const taskName = `Test Task ${uniqueId}`;

  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('#identifier', 'admin');
    await page.fill('#password', 'password123');
    await page.click('button[type="submit"]');
    await expect(page.getByRole('heading', { name: 'Дашборд' })).toBeVisible({ timeout: 10000 });
  });

  test('full cycle: create project -> create stage -> create task in stage', async ({ page }) => {
    // 1. Create Project
    await page.goto('/projects');
    await expect(page.getByRole('heading', { name: 'Проекты' })).toBeVisible();
    
    await page.click('button:has-text("Новый проект")');
    const sheet = page.locator('[role="dialog"]');
    await expect(sheet).toBeVisible();
    
    // Название проекта (используем текст лейбла и соседний инпут)
    await sheet.locator('div:has-text("Название проекта")').locator('input').first().fill(projectName);
    
    // Описание может быть textarea
    const descField = sheet.locator('textarea, input').filter({ has: sheet.locator('..').locator('text=/Описание/i') }).first();
    if (await descField.isVisible()) {
        await descField.fill('Test description');
    } else {
        await sheet.getByLabel(/Описание/i).first().fill('Test description');
    }
    
    // Выбор клиента
    const clientSelect = sheet.locator('div:has-text("Клиент")').locator('button[role="combobox"]').first();
    if (await clientSelect.isVisible()) {
      await clientSelect.click();
      await page.keyboard.press('ArrowDown');
      await page.keyboard.press('Enter');
    }

    // Сохранение проекта
    const [createResponse] = await Promise.all([
        page.waitForResponse(res => res.url().includes('/api/projects') && res.request().method() === 'POST'),
        sheet.locator('button:has-text("Сохранить")').click()
    ]);
    expect(createResponse.ok()).toBeTruthy();
    
    await expect(sheet).not.toBeVisible();
    
    // 2. Open Project and Create Stage
    // Ждем появления в таблице
    await page.fill('input[placeholder*="Поиск"]', projectName);
    const row = page.locator('table tbody tr').filter({ hasText: projectName });
    await expect(row).toBeVisible({ timeout: 10000 });
    
    // Кликаем по названию проекта
    await row.locator('td:nth-child(2)').click();
    await expect(sheet).toBeVisible();
    await expect(sheet.locator('span.font-bold').filter({ hasText: projectName }).first()).toBeVisible();
    
    // Switch to Stages tab
    const stagesTab = sheet.getByRole('tab', { name: /Этапы|Stages/i }).first();
    await stagesTab.click();

    // Create Stage
    await sheet.locator('button:has-text("Добавить этап")').click();
    
    const stageDialog = page.locator('[role="dialog"]').nth(1); // Usually a dialog over sheet
    await stageDialog.locator('input[placeholder*="название этапа"i]').fill(stageName);
    
    await Promise.all([
        page.waitForResponse(res => res.url().includes('/api/projects/') && res.url().includes('/stages') && res.request().method() === 'POST'),
        stageDialog.locator('button:has-text("Создать")').click()
    ]);

    await expect(page.getByText(stageName)).toBeVisible();

    // 3. Create Task in Stage
    // Кликаем на этап чтобы раскрыть (если нужно) и найти кнопку добавления задачи
    const stageItem = page.locator('div').filter({ hasText: stageName }).last();
    await stageItem.click();

    const addTaskBtn = page.locator('button:has-text("Добавить задачу")').first();
    await addTaskBtn.click();

    // Форма задачи
    const taskDialog = page.locator('[role="dialog"]').last();
    await taskDialog.locator('input[placeholder*="название задачи"i]').fill(taskName);
    
    await Promise.all([
        page.waitForResponse(res => res.url().includes('/api/tasks') && res.request().method() === 'POST'),
        taskDialog.locator('button:has-text("Создать")').click()
    ]);

    // Verify task is visible
    await expect(page.getByText(taskName).first()).toBeVisible();

    // 4. Verify task in global tasks list
    await page.goto('/tasks');
    await page.fill('input[placeholder*="Поиск"]', taskName);
    await expect(page.locator('table')).toContainText(taskName);
  });
});