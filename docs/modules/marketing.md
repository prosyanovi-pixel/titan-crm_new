# Модуль Маркетинг (marketing)

## Назначение
Планирование и отслеживание маркетинговых кампаний.

## Основные функции
- Создание и ведение маркетинговых кампаний
- Типы и статусы кампаний
- Аналитика по кампаниям (в рамках общей отчётности)

## Технические спецификации

### Ключевые файлы
- Frontend: `frontend/src/modules/marketing/pages/MarketingPage.tsx`
- Backend: `backend/modules/marketing/routes.js`

### API конечные точки (префикс `/api/marketing`)
- `GET /api/marketing` — список кампаний
- `GET /api/marketing/:id` — кампания
- `POST /api/marketing` — создание
- `PUT /api/marketing/:id` — обновление
- `DELETE /api/marketing/:id` — удаление
- `POST /api/marketing/bulk-delete`, `POST /api/marketing/bulk-update` — массовые операции

### Схема базы данных
- `marketing_campaigns`
- `marketing_status`, `marketing_type` (справочники)

## Структура компонентов
- MarketingPage.tsx (кампании)

## Лучшие практики
- Статусы и типы кампаний вести справочниками, а не константами во фронтенде