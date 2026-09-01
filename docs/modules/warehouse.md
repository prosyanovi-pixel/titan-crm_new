# Модуль Склад (warehouse)

## Назначение
Складской учёт: склады, товары на складах, операции поступления/списания, перемещения и инвентаризация.

## Основные функции
- Управление складами
- Товары на складах (остатки)
- Входящие партии и поступления (входящие складские операции)
- Исходящие операции и списания
- Перемещения между складами
- Инвентаризация (учёт факт/план)

## Технические спецификации

### Ключевые файлы
- Frontend: `frontend/src/modules/warehouse/pages/WarehousePage.tsx`
- Backend: `backend/modules/warehouse/routes.js`

### API конечные точки (префикс `/api/warehouse`)
- Склады: `GET /api/warehouse/warehouses`, `POST /warehouses`, `PUT/DELETE /warehouses/:id`, `POST /warehouses/bulk-delete`, `POST /warehouses/bulk-update`
- Остатки: `GET /api/warehouse/balances`, `GET /balances/:productId`
- Операции: `GET/POST /api/warehouse/transactions` (поступления/списания/перемещения — тип операции в транзакции)
- Заявки на закупку: `GET/POST /api/warehouse/purchase-requests`, `PUT /purchase-requests/:id`

### Схема базы данных
- `warehouses`, `warehouse_tags` — склады и теги
- `inventory_balances` — остатки
- `inventory_transactions`, `inventory_serials`, `inventory_transaction_serials` — операции и серийный учёт
- `purchase_requests` — заявки на закупку

## Структура компонентов
- WarehousePage.tsx (складской учёт)

## Лучшие практики
- Операции проводить только транзакционно и пересчитывать остатки по факту (не хранить расходящиеся счётчики)
- Движения товаров логировать для аудита (кто, когда, откуда/куда)