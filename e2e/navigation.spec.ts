import { test, expect } from '@playwright/test';

test.describe('Navigation Menu', () => {
  test.beforeEach(async ({ page }) => {
    // Логинимся перед каждым тестом
    await page.goto('/login');
    await page.fill('#identifier', 'admin');
    await page.fill('#password', 'password123');
    await page.click('button[type="submit"]');
    await expect(page.getByRole('heading', { name: 'Дашборд' })).toBeVisible({ timeout: 5000 });
    
    // Разворачиваем сайдбар если свёрнут
    const expandButton = page.getByTitle('Развернуть меню');
    if (await expandButton.isVisible()) {
      await expandButton.click();
      await page.waitForTimeout(500);
    }
  });

  test('main menu navigation', async ({ page }) => {
    // Проверяем все пункты меню по URL
    const menuItems = [
      { name: 'Рабочее пространство', url: '/', expected: 'Дашборд' },
      { name: 'Контрагенты', url: '/contractors', expected: 'Контрагенты' },
      { name: 'Проекты', url: '/projects', expected: 'Проекты' },
      { name: 'Почта', url: '/mail', expected: null },
      { name: 'Документы', url: '/documents', expected: 'Документы' },
      { name: 'Задачи', url: '/tasks', expected: 'Задачи' },
      { name: 'Календарь', url: '/calendar', expected: 'Календарь' },
      { name: 'Юристы', url: '/lawyers', expected: 'Юристы' },
      { name: 'Финансы', url: '/finance', expected: 'Финансы' }, 
      { name: 'Настройки', url: '/settings', expected: 'Настройки' },
    ];

    for (const item of menuItems) {
      // Находим ссылку по URL и кликаем
      const link = page.locator(`a[href="${item.url}"]`).first();
      await link.click();
      
      // Ждём загрузки страницы
      await page.waitForURL(new RegExp(item.url));
      
      // Проверяем заголовок страницы (если указан)
      if (item.expected) {
        await expect(page.getByRole('heading', { name: item.expected })).toBeVisible({ timeout: 5000 });
      }
    }
  });

  test('sidebar collapse/expand', async ({ page }) => {
    // Находим кнопку сворачивания меню (это логотипная область с title)
    const collapseButton = page.getByTitle('Свернуть меню');
    const expandButton = page.getByTitle('Развернуть меню');
    
    if (await collapseButton.isVisible()) {
      await collapseButton.click();
      await page.waitForTimeout(500);
      await expect(expandButton).toBeVisible();
      
      await expandButton.click();
      await page.waitForTimeout(500);
      await expect(collapseButton).toBeVisible();
    }
  });

  test('user profile navigation', async ({ page }) => {
    // Кликаем на аватар пользователя (инициалы "АА" или "ПИ")
    const userAvatar = page.getByText(/АА|ПИ/).first();
    await expect(userAvatar).toBeVisible();
    await userAvatar.click();
    
    // Проверяем переход в профиль
    await page.waitForURL(/\/profile/);
    await expect(page.getByRole('heading', { name: 'Профиль' })).toBeVisible({ timeout: 3000 });
  });

  test('notifications panel', async ({ page }) => {
    // Ищем кнопку уведомлений
    const notificationButton = page.getByRole('button', { name: /уведомления|notifications/i });
    if (await notificationButton.isVisible()) {
      await notificationButton.click();
      await page.waitForTimeout(500);
    }
  });

  test('search functionality', async ({ page }) => {
    // Ищем поле поиска
    const searchInput = page.getByPlaceholder(/поиск/i);
    if (await searchInput.isVisible()) {
      await searchInput.fill('тест');
      await page.waitForTimeout(500);
      await searchInput.clear();
    }
  });

  test('breadcrumbs navigation', async ({ page }) => {
    // Переходим в раздел
    await page.getByRole('link', { name: 'Контрагенты' }).click();
    await page.waitForURL(/\/contractors/);
    
    // Проверяем наличие хлебных крошек
    const breadcrumbs = page.getByRole('navigation', { name: /хлебные крошки/i });
    if (await breadcrumbs.isVisible()) {
      const homeLink = breadcrumbs.getByRole('link', { name: /главная/i });
      if (await homeLink.isVisible()) {
        await homeLink.click();
        await expect(page.getByRole('heading', { name: 'Дашборд' })).toBeVisible({ timeout: 5000 });
      }
    }
  });
});
