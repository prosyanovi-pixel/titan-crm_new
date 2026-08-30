# Services Module

> 📄 **Синхронизировано** с [docs/modules/services.md](../../docs/modules/services.md) — актуальная компактная спецификация модуля.

## Назначение (Purpose)
Каталог услуг с категориями, статусами и тегами; использование услуг в продажах, договорах и проектах.

## Основные функции (Core Functions)
- Каталог услуг
- Категории, статусы и теги услуг
- Использование услуг в прайс-листах, коммерческих предложениях и сделках

## Технические спецификации (Technical Specifications)

### Ключевые файлы (Key Files)
- Frontend: `frontend/src/modules/services/pages/ServicesPage.tsx`
- Backend: `backend/modules/services/routes.js`

### API конечные точки (API Endpoints)
- `GET/POST /api/services` — услуги
- `GET/PUT/DELETE /api/services/:id`
- Категории/статусы/теги — сопутствующие эндпоинты модуля

### Схема базы данных (Database Schema)
- `services`
- `service_categories`, `service_status`, `service_tags`

## Структура компонентов (Component Structure)
- ServicesPage.tsx

## Лучшие практики (Best Practices)
- Справочники категорий/статусов/тегов выносить в отдельные таблицы
- Стоимость услуг — в прайс-листах; в карточке услуги хранить только описание и характеристики