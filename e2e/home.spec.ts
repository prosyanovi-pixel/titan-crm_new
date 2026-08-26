import { test, expect } from '@playwright/test';

test('homepage loads', async ({ page }) => {
  // Логинимся
  await page.goto('/login');
  await page.fill('#identifier', 'admin');
  await page.fill('#password', 'password123');
  await page.click('button[type="submit"]');
  
  // Ожидаем Дашборд
  await expect(page).toHaveTitle(/titan crm/i);
  await expect(page.getByRole('heading', { name: 'Дашборд' })).toBeVisible({ timeout: 10000 });
});