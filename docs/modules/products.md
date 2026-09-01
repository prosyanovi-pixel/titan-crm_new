# Модуль Товары (products)

## Назначение
Номенклатура товаров/продуктов с категориями, компонентами, статусами и тегами.

## Основные функции
- Каталог товаров (продуктов)
- Категории и компоненты товаров
- Статусы и теги товаров
- Использование товаров в прайс-листах, закупках и продажах

## Технические спецификации

### Ключевые файлы
- Frontend: `frontend/src/modules/products/pages/ProductsPage.tsx`
- Backend: `backend/modules/products/routes.js`

### API конечные точки (префикс `/api/products`)
- `GET /api/products` — товары
- `POST /api/products` — создание
- `PUT/DELETE /api/products/:id` — обновление/удаление
- `POST /api/products/bulk-delete`, `POST /api/products/bulk-update` — массовые операции
- `POST /api/products/export`, `POST /api/products/import` — экспорт/импорт
- Категории: `GET /api/products/categories`, `POST /categories`, `PUT/DELETE /categories/:id`

### Схема базы данных
- `products`
- `product_categories`, `product_status`, `product_tags`, `product_components`

## Структура компонентов
- ProductsPage.tsx

## Лучшие практики
- Справочники категорий/статусов/тегов выносить в отдельные таблицы
- Для складского учёта товаров использовать модуль Склад (warehouse)