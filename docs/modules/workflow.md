# Модуль Воркфлоу (workflow)

## Назначение
Бизнес-процессы и воркфлоу: рабочие потоки, этапы, условия переходов и интеграция с сущностями CRM.

## Основные функции
- Определение рабочих потоков (workflows) и их этапов
- Условия и переходы между этапами
- Привязка воркфлоу к сущностям (договоры, задачи, сделки)

## Технические спецификации

### Ключевые файлы
- Frontend: `frontend/src/modules/workflow/pages/WorkflowsPage.tsx`
- Backend: `backend/modules/workflow/workflowRoutes.js`, prefix `/api/workflows`

### API конечные точки (префикс `/api/workflows`)
- `GET /api/workflows` — список воркфлоу
- `GET /api/workflows/:id` — воркфлоу
- `POST /api/workflows` — создание
- `PUT/DELETE /api/workflows/:id` — обновление/удаление
- `POST /api/workflows/:id/run` — запуск
- `POST /api/workflows/:id/validate` — валидация
- История исполнений: `GET /:id/history`, `GET /:id/history/:execId`, `POST /:id/history/:execId/retry`, `POST /:id/history/:execId/approve`, `DELETE /:id/history`, `DELETE /:id/history/:execId`
- Триггеры: `POST /api/workflows/:id/webhook`, `GET /api/workflows/registry/actions`

### Схема базы данных
- `workflows` — рабочие потоки
- `workflow_steps` — шаги воркфлоу (с условиями)
- `workflow_executions`, `workflow_execution_logs` — исполнения и логи

## Структура компонентов
- WorkflowsPage.tsx (конструктор воркфлоу)

## Лучшие практики
- Движение по воркфлоу логировать в активности сущности
- Переходы валидировать на бэкенде (права, условия этапа)