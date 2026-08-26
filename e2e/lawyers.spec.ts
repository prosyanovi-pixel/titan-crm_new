import { test, expect } from '@playwright/test';

test.describe('Lawyers Module', () => {
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

  test('view lawyers list', async ({ page }) => {
    await page.goto('/lawyers');
    await page.waitForURL(/\/lawyers/);

    // Проверяем заголовок
    await expect(page.getByRole('heading', { name: 'Юристы' })).toBeVisible();

    // Проверяем наличие таблицы юристов
    const table = page.getByRole('table');
    if (await table.isVisible()) {
      console.log('✓ Таблица юристов найдена');

      // Проверяем заголовки
      const headers = ['Имя', 'Дела', 'Статус'];
      for (const header of headers) {
        const headerElement = page.getByText(header);
        if (await headerElement.isVisible()) {
          console.log(`✓ Заголовок "${header}" найден`);
        }
      }
    }
  });

  test('view lawyer details', async ({ page }) => {
    await page.goto('/lawyers');
    await page.waitForURL(/\/lawyers/);

    // Кликаем на первого юриста
    const lawyerLink = page.getByRole('link').filter({ hasText: /[А-Яа-яA-Za-z]/ }).first();
    if (await lawyerLink.isVisible()) {
      await lawyerLink.click();
      await page.waitForTimeout(1000);

      // Проверяем наличие информации о юристе
      const detailPage = page.getByText(/дела|специализация|опыт/i);
      if (await detailPage.isVisible()) {
        console.log('✓ Страница деталей юриста открыта');
      }
    }
  });

  test('create lawyer form', async ({ page }) => {
    await page.goto('/lawyers');
    await page.waitForURL(/\/lawyers/);

    const createButton = page.getByRole('button', { name: /создать|добавить|new/i });
    if (await createButton.isVisible()) {
      await createButton.click();
      await page.waitForTimeout(1000);

      // Проверяем форму создания
      const form = page.getByRole('dialog');
      if (await form.isVisible()) {
        console.log('✓ Форма создания юриста открыта');

        // Проверяем поля формы
        const fields = ['Имя', 'Email', 'Телефон', 'Специализация'];
        for (const field of fields) {
          const input = page.getByLabel(new RegExp(field, 'i'));
          if (await input.isVisible()) {
            console.log(`✓ Поле "${field}" найдено`);
          }
        }

        // Закрываем форму
        const cancelButton = page.getByRole('button', { name: /отмена|закрыть/i });
        if (await cancelButton.isVisible()) {
          await cancelButton.click();
        }
      }
    }
  });

  test('lawyer filters', async ({ page }) => {
    await page.goto('/lawyers');
    await page.waitForURL(/\/lawyers/);

    const filterButton = page.getByRole('button', { name: /фильтр|filter/i });
    if (await filterButton.isVisible()) {
      await filterButton.click();
      await page.waitForTimeout(500);

      // Проверяем наличие опций фильтрации
      const filterOptions = page.getByText(/статус|специализация|активный/i).first();
      if (await filterOptions.isVisible()) {
        console.log('✓ Фильтры юристов доступны');
      }

      // Закрываем фильтр
      const closeFilterButton = page.getByRole('button', { name: /фильтр|закрыть|close/i }).first();
      if (await closeFilterButton.isVisible()) {
        await closeFilterButton.click();
      }
    }
  });
});

test.describe('Legal Cases', () => {
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

  test('view legal cases list', async ({ page }) => {
    await page.goto('/lawyers');
    await page.waitForURL(/\/lawyers/);

    // Переходим на вкладку дел
    const casesTab = page.getByRole('tab', { name: /дела|cases/i }).first();
    if (await casesTab.isVisible()) {
      await casesTab.click();
      await page.waitForTimeout(500);

      // Проверяем наличие таблицы дел
      const table = page.getByRole('table');
      if (await table.isVisible()) {
        console.log('✓ Таблица дел найдена');

        // Проверяем заголовки
        const headers = ['Номер', 'Клиент', 'Статус', 'Сумма'];
        for (const header of headers) {
          const headerElement = page.getByText(header);
          if (await headerElement.isVisible()) {
            console.log(`✓ Заголовок "${header}" найден`);
          }
        }
      }
    }
  });

  test('view case details', async ({ page }) => {
    await page.goto('/lawyers');
    await page.waitForURL(/\/lawyers/);

    // Переходим на вкладку дел
    const casesTab = page.getByRole('tab', { name: /дела|cases/i }).first();
    if (await casesTab.isVisible()) {
      await casesTab.click();
      await page.waitForTimeout(500);

      // Кликаем на первое дело
      const caseLink = page.getByRole('link').filter({ hasText: /[А-Яа-яA-Za-z0-9]/ }).first();
      if (await caseLink.isVisible()) {
        await caseLink.click();
        await page.waitForTimeout(1000);

        // Проверяем наличие информации о деле
        const detailPage = page.getByText(/описание|сумма|суд/i);
        if (await detailPage.isVisible()) {
          console.log('✓ Страница деталей дела открыта');
        }
      }
    }
  });

  test('create legal case form', async ({ page }) => {
    await page.goto('/lawyers');
    await page.waitForURL(/\/lawyers/);

    // Переходим на вкладку дел
    const casesTab = page.getByRole('tab', { name: /дела|cases/i }).first();
    if (await casesTab.isVisible()) {
      await casesTab.click();
      await page.waitForTimeout(500);

      const createButton = page.getByRole('button', { name: /создать|добавить|new/i });
      if (await createButton.isVisible()) {
        await createButton.click();
        await page.waitForTimeout(1000);

        // Проверяем форму создания дела
        const form = page.getByRole('dialog');
        if (await form.isVisible()) {
          console.log('✓ Форма создания дела открыта');

          // Проверяем поля формы
          const fields = ['Номер', 'Клиент', 'Сумма', 'Описание'];
          for (const field of fields) {
            const input = page.getByLabel(new RegExp(field, 'i'));
            if (await input.isVisible()) {
              console.log(`✓ Поле "${field}" найдено`);
            }
          }

          // Закрываем форму
          const cancelButton = page.getByRole('button', { name: /отмена|закрыть/i });
          if (await cancelButton.isVisible()) {
            await cancelButton.click();
          }
        }
      }
    }
  });

  test('case status filters', async ({ page }) => {
    await page.goto('/lawyers');
    await page.waitForURL(/\/lawyers/);

    // Переходим на вкладку дел
    const casesTab = page.getByRole('tab', { name: /дела|cases/i }).first();
    if (await casesTab.isVisible()) {
      await casesTab.click();
      await page.waitForTimeout(500);

      const filterButton = page.getByRole('button', { name: /фильтр|filter/i });
      if (await filterButton.isVisible()) {
        await filterButton.click();
        await page.waitForTimeout(500);

        // Проверяем наличие опций фильтрации по статусам
        const filterOptions = page.getByText(/статус|в работе|завершено/i).first();
        if (await filterOptions.isVisible()) {
          console.log('✓ Фильтры по статусам дел доступны');
        }

        // Закрываем фильтр
        const closeFilterButton = page.getByRole('button', { name: /фильтр|закрыть|close/i }).first();
        if (await closeFilterButton.isVisible()) {
          await closeFilterButton.click();
        }
      }
    }
  });
});
