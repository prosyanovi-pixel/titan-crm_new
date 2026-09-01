# Модуль Задачи (tasks)

## Назначение
Управление задачами: реестр задач, статусы, приоритеты, исполнители, активности и подзадачи; интеграция с проектами.

## Основные функции
- Реестр задач с фильтрацией и статусами
- Приоритеты задач
- Подзадачи (subtasks)
- Активности по задаче (комментарии/события), иерархия
- Связь задач с проектами и этапами проектов
- Всеобъемлющая работа с задачами из карточек связанных сущностей

## Технические спецификации

### Ключевые файлы
- Frontend: `frontend/src/modules/tasks/pages/TasksPage.tsx`, `api/taskService.ts`, `api/tasks.api.ts`, `api/endpoints.ts`
- Backend: `backend/modules/tasks/routes.js`

### API конечные точки (префикс `/api/tasks`)
- `GET /api/tasks` — задачи
- `GET /api/tasks/stats` — агрегаты
- `GET /api/tasks/:id` — карточка задачи
- `GET /api/tasks/:id/activity` — активности задачи
- `POST /api/tasks` — создание
- `PUT /api/tasks/:id` — обновление
- `DELETE /api/tasks/:id` — удаление
- `POST /api/tasks/bulk-delete`, `POST /api/tasks/bulk-update` — массовые операции

Отдельных эндпоинтов файлов и star у задач нет.

### Схема базы данных
- `tasks`, `subtasks`
- `task_status`, `priority` (справочники)
- `project_stage`, `project_stages` — связь задач с этапами проектов

## Структура компонентов
- TasksPage.tsx (реестр задач)

## Лучшие практики
- Приоритеты и статусы — справочники (таблицы `priority`, `task_status`)
- Активности хранить в единой таблице aktivitiy-логов для аудита изменений