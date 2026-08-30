# Products Module

> 📄 **Синхронизировано** с [docs/modules/products.md](../../docs/modules/products.md) — актуальная компактная спецификация модуля.

## Назначение (Purpose)
Номенклатура товаров/продуктов с категориями, компонентами, статусами и тегами.

## Основные функции (Core Functions)
- Каталог товаров (продуктов)
- Категории и компоненты товаров
- Статусы и теги товаров
- Использование товаров в прайс-листах, закупках и продажах

## Технические спецификации (Technical Specifications)

### Ключевые файлы (Key Files)
- Frontend: `frontend/src/modules/products/pages/ProductsPage.tsx`
- Backend: `backend/modules/products/routes.js`

### API конечные точки (API Endpoints)
- `GET/POST /api/products` — товары
- `GET/PUT/DELETE /api/products/:id`
- Категории/статусы/теги — сопутствующие эндпоинты модуля

### Схема базы данных (Database Schema)
- `products`
- `product_categories`, `product_status`, `product_tags`, `product_components`

## Структура компонентов (Component Structure)
- ProductsPage.tsx

## Лучшие практики (Best Practices)
- Справочники категорий/статусов/тегов выносить в отдельные таблицы
- Для складского учёта товаров использовать модуль Склад (Warehouse)