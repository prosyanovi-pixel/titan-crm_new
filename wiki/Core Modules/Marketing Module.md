# Marketing Module

> 📄 **Синхронизировано** с [docs/modules/marketing.md](../../docs/modules/marketing.md) — актуальная компактная спецификация модуля.

## Назначение (Purpose)
Планирование и отслеживание маркетинговых кампаний.

## Основные функции (Core Functions)
- Создание и ведение маркетинговых кампаний
- Типы и статусы кампаний
- Аналитика по кампаниям (в рамках общей отчётности)

## Технические спецификации (Technical Specifications)

### Ключевые файлы (Key Files)
- Frontend: `frontend/src/modules/marketing/pages/MarketingPage.tsx`
- Backend: `backend/modules/marketing/routes.js`

### API конечные точки (API Endpoints)
- `GET/POST /api/marketing/campaigns` — кампании
- `GET/PUT/DELETE /api/marketing/campaigns/:id`

### Схема базы данных (Database Schema)
- `marketing_campaigns`
- `marketing_status`, `marketing_type` (справочники)

## Структура компонентов (Component Structure)
- MarketingPage.tsx (кампании)

## Лучшие практики (Best Practices)
- Статусы и типы кампаний вести справочниками, а не константами во фронтенде
- При изменении прав доступа синхронизировать `permissions.ts`, i18n и сиды