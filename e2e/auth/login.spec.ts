import { test, expect } from '@playwright/test';

test('user can log in', async ({ page }) => {
  await page.goto('/login');
  
  // Используем nickname 'admin' и пароль 'password123' (реальные данные из БД)
  await page.fill('#identifier', 'admin');
  await page.fill('#password', 'password123');
  await page.click('button[type="submit"]');
  
  // Ожидаем редирект на dashboard или главную страницу
  await expect(page).toHaveURL(/\/$/);
  
  // Проверяем, что пользователь вошёл в систему (ищем заголовок Дашборд)
  await expect(page.getByRole('heading', { name: 'Дашборд' })).toBeVisible({ timeout: 5000 });
});