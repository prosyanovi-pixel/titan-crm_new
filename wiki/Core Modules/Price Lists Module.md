# Price Lists Module

> 📄 **Синхронизировано** с [docs/modules/price_lists.md](../../docs/modules/price_lists.md) — актуальная компактная спецификация модуля.

## Назначение (Purpose)
Ведение прайс-листов: перечней позиций с ценами для продуктов и услуг.

## Основные функции (Core Functions)
- Создание и ведение прайс-листов
- Позиции прайс-листа (товары/услуги и их цены)
- Привязка прайс-листов к продажам и коммерческим предложениям

## Технические спецификации (Technical Specifications)

### Ключевые файлы (Key Files)
- Frontend: `frontend/src/modules/price_lists/pages/PriceListsPage.tsx`
- Backend: `backend/modules/price_lists/routes.js`, монтируется на `/api/price-lists`

### API конечные точки (API Endpoints)
- `GET/POST /api/price-lists` — прайс-листы
- `GET/PUT/DELETE /api/price-lists/:id` — карточка прайс-листа
- `/api/price-lists/:id/items` — позиции

### Схема базы данных (Database Schema)
- `price_lists`
- `price_list_items`

## Структура компонентов (Component Structure)
- PriceListsPage.tsx

## Лучшие практики (Best Practices)
- Цены хранить в денежном формате с фиксированной точностью (не использовать float)
- Позиции КП копировать из прайс-листа со снапшотом цены (не хранить живые ссылки на изменяемые цены)