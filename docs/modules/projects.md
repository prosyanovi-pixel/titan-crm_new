# Модуль Проекты

## Назначение
Модуль проектов отвечает за управление проектами, задачами и коллаборацией.

## Основные функции
- Создание и управление проектами
- Назначение задач и отслеживание прогресса
- Управление временными рамками
- Коллаборация между членами команды
- Отслеживание бюджета
- Прогресс отчетность

## Технические спецификации

### Ключевые файлы
- Frontend: `frontend/src/modules/projects/` (ProjectsPage.tsx и др.)
- Backend: `backend/modules/projects/routes.js`, prefix `/api/projects`

### API конечные точки
- `GET /api/projects` - Список всех проектов
- `GET /api/projects/:id` - Получение конкретного проекта
- `POST /api/projects` - Создание проекта
- `PUT /api/projects/:id` - Обновление проекта
- `DELETE /api/projects/:id` - Удаление проекта
- `GET /api/projects/stats`, `GET /api/projects/sales-pipeline` - Агрегаты
- `POST /api/projects/bulk-update`, `POST /api/projects/bulk-delete` - Массовые операции
- `POST /api/projects/:id/complete`, `POST /api/projects/:id/archive` - Завершение/архивация
- Этапы: `GET/POST /api/projects/:id/stages`, `GET/PUT/DELETE /api/projects/:projectId/stages/:stageId`, `POST .../complete`, `POST .../reorder`, `GET /:id/stages/summary`
- График платежей: `GET/POST /api/projects/:id/payment-schedule`, `PUT/DELETE .../payment-schedule/:paymentId`, `POST .../pay`, `GET .../summary`
- Доходы: `GET/POST /api/projects/:id/revenues`, `PUT/DELETE .../revenues/:revenueId`, `POST .../receive`, `GET .../summary`
- Расходы: `GET /api/projects/expenses/categories`, `GET/POST /api/projects/:id/expenses`, `PUT/DELETE .../expenses/:expenseId`, `POST .../approve`, `POST .../pay`, `GET .../chart`, `GET .../summary`
- Финансы: `GET /api/projects/:id/pnl`, `GET /:id/finance/summary`, `GET /:id/finance/taxes`, `GET /:id/finance/report/pdf`

Задачи — отдельный модуль `/api/tasks` (не вложены в projects).

### Схема базы данных
- `projects`, `project_status` - проекты и статусы
- `project_stages`, `project_stage` - этапы проектов
- `project_payment_schedule` - график платежей
- `project_revenues` - доходы
- `project_expenses` - расходы (с полем vat_rate)
- `tasks`, `subtasks` - задачи (модуль tasks)

## Структура компонентов
- ProjectsPage.tsx, карточки и формы проектов (см. `frontend/src/modules/projects/`)

## Лучшие практики
- Реализация правильного отслеживания статуса проекта
- Обеспечение уведомлений о назначении задач
- Использование прогресса по вехам для отслеживания
- Визуализация временной шкалы проекта