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

### API конечные точки
- `GET/POST /api/marketing/campaigns` — кампании
- `GET/PUT/DELETE /api/marketing/campaigns/:id`

### Схема базы данных
- `marketing_campaigns`
- `marketing_status`, `marketing_type` (справочники)

## Структура компонентов
- MarketingPage.tsx (кампании)

## Лучшие практики
- Статусы и типы кампаний вести справочниками, а не константами во фронтенде