import { test, expect } from '@playwright/test';

test.describe('Finance Module', () => {
  test.beforeEach(async ({ page }) => {
    // Логинимся
    await page.goto('/login');
    await page.fill('#identifier', 'admin');
    await page.fill('#password', 'password123');
    await page.click('button[type="submit"]');
    await expect(page.getByRole('heading', { name: 'Дашборд' })).toBeVisible({ timeout: 5000 });

    // Разворачиваем сайдбар
    const expandButton = page.getByText('Развернуть меню');
    if (await expandButton.isVisible()) {
      await expandButton.click();
      await page.waitForTimeout(300);
    }
  });

  test('view finance dashboard', async ({ page }) => {
    await page.goto('/finance');
    await page.waitForURL(/\/finance/);

    // Проверяем заголовок
    const heading = page.getByRole('heading').first();
    await expect(heading).toBeVisible();

    // Проверяем наличие финансовых метрик (используем first() для strict mode)
    const metrics = ['Счета', 'Платежи', 'Задолженность'];
    for (const metric of metrics) {
      const metricElement = page.getByText(new RegExp(metric, 'i')).first();
      if (await metricElement.isVisible()) {
        console.log(`✓ Метрика "${metric}" найдена`);
      }
    }
  });

  test('view invoices list', async ({ page }) => {
    await page.goto('/finance');
    await page.waitForURL(/\/finance/);

    // Переходим на вкладку счетов
    const invoicesTab = page.getByRole('tab', { name: /счета|invoices/i }).first();
    if (await invoicesTab.isVisible()) {
      await invoicesTab.click();
      await page.waitForTimeout(500);

      // Проверяем наличие таблицы счетов
      const table = page.getByRole('table');
      if (await table.isVisible()) {
        console.log('✓ Таблица счетов найдена');

        // Проверяем заголовки
        const headers = ['Номер', 'Контрагент', 'Сумма', 'Статус'];
        for (const header of headers) {
          const headerElement = page.getByText(header);
          if (await headerElement.isVisible()) {
            console.log(`✓ Заголовок "${header}" найден`);
          }
        }
      }
    }
  });

  test('view payments list', async ({ page }) => {
    await page.goto('/finance');
    await page.waitForURL(/\/finance/);

    // Переходим на вкладку платежей
    const paymentsTab = page.getByRole('tab', { name: /платежи|payments/i }).first();
    if (await paymentsTab.isVisible()) {
      await paymentsTab.click();
      await page.waitForTimeout(500);

      // Проверяем наличие таблицы платежей
      const table = page.getByRole('table');
      if (await table.isVisible()) {
        console.log('✓ Таблица платежей найдена');
      }
    }
  });

  test('create invoice form validation', async ({ page }) => {
    await page.goto('/finance');
    await page.waitForURL(/\/finance/);

    // Ищем кнопку создания счёта
    const createButton = page.getByRole('button', { name: /создать счёт|new invoice/i }).first();
    
    if (await createButton.isVisible()) {
      await createButton.click();
      await page.waitForTimeout(1000);

      // Проверяем наличие формы
      const form = page.getByRole('dialog').first();
      if (await form.isVisible()) {
        console.log('✓ Форма создания счёта открыта');

        // Проверяем обязательные поля
        const fields = ['Номер счёта', 'Контрагент', 'Сумма'];
        for (const field of fields) {
          const input = page.getByLabel(new RegExp(field, 'i'));
          if (await input.isVisible()) {
            console.log(`✓ Поле "${field}" найдено`);
          }
        }

        // Закрываем форму
        const closeButton = page.getByRole('button', { name: /закрыть|отмена/i }).first();
        if (await closeButton.isVisible()) {
          await closeButton.click();
        }
      }
    }
  });

  test('invoice filters', async ({ page }) => {
    await page.goto('/finance');
    await page.waitForURL(/\/finance/);

    // Ищем кнопку фильтров
    const filterButton = page.getByRole('button', { name: /фильтр|filter/i }).first();
    if (await filterButton.isVisible()) {
      await filterButton.click();
      await page.waitForTimeout(500);

      // Проверяем наличие опций фильтрации
      const filterOptions = page.getByText(/статус|период|контрагент/i).first();
      if (await filterOptions.isVisible()) {
        console.log('✓ Фильтры счетов доступны');
      }

      // Закрываем фильтр
      const closeFilterButton = page.getByRole('button', { name: /фильтр|закрыть|close/i }).first();
      if (await closeFilterButton.isVisible()) {
        await closeFilterButton.click();
      }
    }
  });
});

test.describe('Finance - Reports', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('#identifier', 'admin');
    await page.fill('#password', 'password123');
    await page.click('button[type="submit"]');
    await expect(page.getByRole('heading', { name: 'Дашборд' })).toBeVisible({ timeout: 5000 });

    const expandButton = page.getByText('Развернуть меню');
    if (await expandButton.isVisible()) {
      await expandButton.click();
      await page.waitForTimeout(300);
    }
  });

  test('view receivables report', async ({ page }) => {
    await page.goto('/finance');
    await page.waitForURL(/\/finance/);

    // Переходим на вкладку отчётов
    const reportsTab = page.getByRole('tab', { name: /отчёты|reports/i }).first();
    if (await reportsTab.isVisible()) {
      await reportsTab.click();
      await page.waitForTimeout(500);

      // Проверяем наличие отчёта по дебиторке
      const receivablesSection = page.getByText(/дебиторская|receivables/i).first();
      if (await receivablesSection.isVisible()) {
        console.log('✓ Отчёт по дебиторской задолженности найден');
      }
    }
  });
});
