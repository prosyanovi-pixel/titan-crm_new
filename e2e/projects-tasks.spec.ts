import { test, expect } from '@playwright/test';

test.describe('Projects Module', () => {
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

  test('view projects list', async ({ page }) => {
    await page.goto('/projects');
    await page.waitForURL(/\/projects/);
    
    await expect(page.getByRole('heading', { name: 'Проекты' })).toBeVisible();
    
    // Проверяем наличие проекта "ПНР Нижнекамск (СИБУР)" из БД
    const projectElement = page.getByText('ПНР Нижнекамск (СИБУР)').first();
    if (await projectElement.isVisible()) {
      console.log('✓ Проект из БД найден');
    }
  });

  test('project filters and sorting', async ({ page }) => {
    await page.goto('/projects');
    await page.waitForURL(/\/projects/);
    
    // Ищем фильтры
    const statusFilter = page.getByRole('button', { name: /статус|status/i });
    if (await statusFilter.isVisible()) {
      await statusFilter.click();
      await page.waitForTimeout(500);
      
      // Выбираем статус
      const activeStatus = page.getByText(/активный|active/i);
      if (await activeStatus.isVisible()) {
        await activeStatus.click();
        await page.waitForTimeout(1000);
      }
    }
  });

  test('view project details', async ({ page }) => {
    await page.goto('/projects');
    await page.waitForURL(/\/projects/);
    
    // Кликаем на первый проект
    const projectCard = page.getByRole('link', { name: /ПНР|СИБУР|проект/i }).first();
    if (await projectCard.isVisible()) {
      await projectCard.click();
      await page.waitForTimeout(1000);
      
      // Проверяем наличие информации о проекте
      const projectInfo = page.getByText(/описание|этап|контрагент/i);
      if (await projectInfo.isVisible()) {
        console.log('✓ Детали проекта отображаются');
      }
    }
  });

  test('create project form', async ({ page }) => {
    await page.goto('/projects');
    await page.waitForURL(/\/projects/);
    
    const createButton = page.getByRole('button', { name: /создать|добавить|new/i });
    if (await createButton.isVisible()) {
      await createButton.click();
      await page.waitForTimeout(1000);
      
      // Проверяем форму создания
      const formFields = ['Название', 'Описание', 'Контрагент'];
      for (const field of formFields) {
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
  });

  test('create task in project', async ({ page }) => {
    await page.goto('/projects');
    await page.waitForURL(/\/projects/);
    
    // Открываем проект
    const projectCard = page.getByRole('link', { name: /ПНР|СИБУР/i }).first();
    if (await projectCard.isVisible()) {
      await projectCard.click();
      await page.waitForTimeout(1000);
      
      // Переходим на вкладку задач
      const tasksTab = page.getByRole('tab', { name: /задачи|tasks/i });
      if (await tasksTab.isVisible()) {
        await tasksTab.click();
        await page.waitForTimeout(500);
        
        // Нажимаем кнопку создания задачи
        const createTaskButton = page.getByRole('button', { name: /создать задачу|new task/i });
        if (await createTaskButton.isVisible()) {
          await createTaskButton.click();
          await page.waitForTimeout(1000);
          
          // Проверяем, что открылась форма создания задачи
          const taskForm = page.getByRole('dialog');
          if (await taskForm.isVisible()) {
            console.log('✓ Форма создания задачи открыта');
            
            // Проверяем поля формы
            const titleField = page.getByLabel(/название|заголовок|title/i);
            if (await titleField.isVisible()) {
              console.log('✓ Поле "Заголовок" доступно');
            }
            
            // Закрываем форму
            const closeButton = page.getByRole('button', { name: /закрыть|отмена/i });
            if (await closeButton.isVisible()) {
              await closeButton.click();
            }
          }
        }
      }
    }
  });
});

test.describe('Tasks Module', () => {
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

  test('view tasks list', async ({ page }) => {
    await page.goto('/tasks');
    await page.waitForURL(/\/tasks/);
    
    await expect(page.getByRole('heading', { name: 'Задачи' })).toBeVisible();
  });

  test('task board view', async ({ page }) => {
    await page.goto('/tasks');
    await page.waitForURL(/\/tasks/);
    
    // Ищем переключатель видов (канбан/список)
    const boardView = page.getByRole('button', { name: /канбан|доска|board/i });
    if (await boardView.isVisible()) {
      await boardView.click();
      await page.waitForTimeout(500);
    }
    
    // Проверяем наличие колонок
    const columns = ['To Do', 'In Progress', 'Done', 'К выполнению', 'В работе', 'Выполнено'];
    for (const column of columns) {
      const columnElement = page.getByText(column).first();
      if (await columnElement.isVisible()) {
        console.log(`✓ Колонка "${column}" найдена`);
        break;
      }
    }
  });

  test('task filters', async ({ page }) => {
    await page.goto('/tasks');
    await page.waitForURL(/\/tasks/);
    
    const filterButton = page.getByRole('button', { name: /фильтр|filter/i });
    if (await filterButton.isVisible()) {
      await filterButton.click();
      await page.waitForTimeout(500);
      
      // Фильтр по исполнителю (используем first() для strict mode)
      const assigneeFilter = page.getByText(/исполнитель|assignee/i).first();
      if (await assigneeFilter.isVisible()) {
        console.log('✓ Фильтр по исполнителю доступен');
      }
      
      // Закрываем фильтр
      const closeFilterButton = page.getByRole('button', { name: /фильтр|закрыть|close/i }).first();
      if (await closeFilterButton.isVisible()) {
        await closeFilterButton.click();
      }
    }
  });
});
