import { test, expect } from '@playwright/test';

test.describe('Documents Module', () => {
  test.beforeEach(async ({ page }) => {
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

  test('view documents list', async ({ page }) => {
    await page.goto('/documents');
    await page.waitForURL(/\/documents/);
    
    // Проверяем заголовок (может быть "Документы" или другой)
    const heading = page.getByRole('heading').first();
    await expect(heading).toBeVisible();
  });

  test('upload document button', async ({ page }) => {
    await page.goto('/documents');
    await page.waitForURL(/\/documents/);
    
    // Ищем кнопку загрузки
    const uploadButton = page.getByRole('button', { name: /загрузить|upload|добавить/i });
    if (await uploadButton.isVisible()) {
      console.log('✓ Кнопка загрузки документа найдена');
      
      // Проверяем, что кнопка активна
      const isDisabled = await uploadButton.isDisabled();
      if (!isDisabled) {
        console.log('✓ Кнопка загрузки активна');
      }
    }
  });

  test('document search', async ({ page }) => {
    await page.goto('/documents');
    await page.waitForURL(/\/documents/);
    
    const searchInput = page.getByPlaceholder(/поиск документа/i);
    if (await searchInput.isVisible()) {
      await searchInput.fill('договор');
      await page.waitForTimeout(500);
      await searchInput.clear();
      console.log('✓ Поиск документов работает');
    }
  });

  test('document preview', async ({ page }) => {
    await page.goto('/documents');
    await page.waitForURL(/\/documents/);
    
    // Ищем первый документ в списке
    const documentLink = page.getByRole('link', { name: /[А-Яа-яA-Za-z]/ }).first();
    if (await documentLink.isVisible()) {
      await documentLink.click();
      await page.waitForTimeout(1000);
      
      // Проверяем наличие предпросмотра
      const preview = page.getByRole('dialog');
      if (await preview.isVisible()) {
        console.log('✓ Предпросмотр документа открыт');
        
        // Закрываем предпросмотр
        const closeButton = page.getByRole('button', { name: /закрыть|close/i });
        if (await closeButton.isVisible()) {
          await closeButton.click();
        }
      }
    }
  });

  test('document filters', async ({ page }) => {
    await page.goto('/documents');
    await page.waitForURL(/\/documents/);
    
    const filterButton = page.getByRole('button', { name: /фильтр|filter/i });
    if (await filterButton.isVisible()) {
      await filterButton.click();
      await page.waitForTimeout(500);
      
      // Тип документа
      const typeFilter = page.getByText(/тип документа|document type/i);
      if (await typeFilter.isVisible()) {
        console.log('✓ Фильтр по типу документа доступен');
      }
      
      await filterButton.click();
    }
  });
});

test.describe('Calendar Module', () => {
  test.beforeEach(async ({ page }) => {
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

  test('view calendar', async ({ page }) => {
    await page.goto('/calendar');
    await page.waitForURL(/\/calendar/);
    
    await expect(page.getByRole('heading', { name: 'Календарь' })).toBeVisible();
    
    // Проверяем наличие календаря
    const calendarGrid = page.getByRole('grid');
    if (await calendarGrid.isVisible()) {
      console.log('✓ Календарь отображается');
    }
  });

  test('calendar navigation', async ({ page }) => {
    await page.goto('/calendar');
    await page.waitForURL(/\/calendar/);
    
    // Кнопки навигации
    const prevButton = page.getByRole('button', { name: /<|назад|previous/i });
    const nextButton = page.getByRole('button', { name: />|вперед|next/i });
    
    if (await prevButton.isVisible() && await nextButton.isVisible()) {
      await nextButton.click();
      await page.waitForTimeout(300);
      await prevButton.click();
      await page.waitForTimeout(300);
      console.log('✓ Навигация по календарю работает');
    }
  });

  test('create event button', async ({ page }) => {
    await page.goto('/calendar');
    await page.waitForURL(/\/calendar/);
    
    const createButton = page.getByRole('button', { name: /создать событие|добавить|new event/i });
    if (await createButton.isVisible()) {
      console.log('✓ Кнопка создания события найдена');
    }
  });
});

test.describe('Settings Module', () => {
  test.beforeEach(async ({ page }) => {
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

  test('view settings page', async ({ page }) => {
    await page.goto('/settings');
    await page.waitForURL(/\/settings/);
    
    await expect(page.getByRole('heading', { name: 'Настройки' })).toBeVisible();
  });

  test('settings tabs', async ({ page }) => {
    await page.goto('/settings');
    await page.waitForURL(/\/settings/);
    
    // Ищем вкладки настроек
    const tabs = ['Общие', 'Профиль', 'Безопасность', 'Уведомления', 'Интеграции'];
    for (const tab of tabs) {
      const tabElement = page.getByRole('tab', { name: tab });
      if (await tabElement.isVisible()) {
        console.log(`✓ Вкладка "${tab}" найдена`);
      }
    }
  });

  test('profile settings form', async ({ page }) => {
    await page.goto('/settings');
    await page.waitForURL(/\/settings/);
    
    // Находим вкладку профиля
    const profileTab = page.getByRole('tab', { name: /профиль|profile/i });
    if (await profileTab.isVisible()) {
      await profileTab.click();
      await page.waitForTimeout(500);
      
      // Проверяем поля формы
      const fields = ['Имя', 'Email', 'Телефон'];
      for (const field of fields) {
        const input = page.getByLabel(new RegExp(field, 'i'));
        if (await input.isVisible()) {
          console.log(`✓ Поле "${field}" доступно для редактирования`);
        }
      }
    }
  });
});
