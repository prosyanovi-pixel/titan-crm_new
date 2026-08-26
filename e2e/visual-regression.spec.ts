import { test, expect } from '@playwright/test';

test.describe('Visual Regression Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Логинимся
    await page.goto('/login');
    await page.fill('#identifier', 'admin');
    await page.fill('#password', 'password123');
    await page.click('button[type="submit"]');
    await expect(page.getByRole('heading', { name: 'Дашборд' })).toBeVisible({ timeout: 5000 });
  });

  test('Dashboard screenshot', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(1000);

    // Делаем скриншот дашборда
    await expect(page).toHaveScreenshot('dashboard-main.png', {
      fullPage: false,
      maxDiffPixels: 100,
    });
  });

  test('Contractors page screenshot', async ({ page }) => {
    await page.goto('/contractors');
    await page.waitForURL(/\/contractors/);
    await page.waitForTimeout(1000);

    await expect(page).toHaveScreenshot('contractors-list.png', {
      fullPage: false,
      maxDiffPixels: 100,
    });
  });

  test('Projects page screenshot', async ({ page }) => {
    await page.goto('/projects');
    await page.waitForURL(/\/projects/);
    await page.waitForTimeout(1000);

    await expect(page).toHaveScreenshot('projects-list.png', {
      fullPage: false,
      maxDiffPixels: 100,
    });
  });

  test('Tasks board screenshot', async ({ page }) => {
    await page.goto('/tasks');
    await page.waitForURL(/\/tasks/);
    await page.waitForTimeout(1000);

    await expect(page).toHaveScreenshot('tasks-board.png', {
      fullPage: false,
      maxDiffPixels: 100,
    });
  });

  test('Finance page screenshot', async ({ page }) => {
    await page.goto('/finance');
    await page.waitForURL(/\/finance/);
    await page.waitForTimeout(1000);

    await expect(page).toHaveScreenshot('finance-main.png', {
      fullPage: false,
      maxDiffPixels: 100,
    });
  });

  test('Lawyers page screenshot', async ({ page }) => {
    await page.goto('/lawyers');
    await page.waitForURL(/\/lawyers/);
    await page.waitForTimeout(1000);

    await expect(page).toHaveScreenshot('lawyers-list.png', {
      fullPage: false,
      maxDiffPixels: 100,
    });
  });

  test('Settings page screenshot', async ({ page }) => {
    await page.goto('/settings');
    await page.waitForURL(/\/settings/);
    await page.waitForTimeout(1000);

    await expect(page).toHaveScreenshot('settings-main.png', {
      fullPage: false,
      maxDiffPixels: 100,
    });
  });

  test('Login page screenshot', async ({ page }) => {
    // Выходим из системы
    await page.context().clearCookies();
    await page.goto('/login');
    await page.waitForTimeout(500);

    await expect(page).toHaveScreenshot('login-page.png', {
      fullPage: false,
      maxDiffPixels: 50,
    });
  });
});
