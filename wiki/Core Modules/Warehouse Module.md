# Warehouse Module

> 📄 **Синхронизировано** с [docs/modules/warehouse.md](../../docs/modules/warehouse.md) — актуальная компактная спецификация модуля.

## Назначение (Purpose)
Складской учёт: склады, товары на складах, операции поступления/списания, перемещения и инвентаризация.

## Основные функции (Core Functions)
- Управление складами
- Товары на складах (остатки)
- Входящие партии и поступления (входящие складские операции)
- Исходящие операции и списания
- Перемещения между складами
- Инвентаризация (учёт факт/план)

## Технические спецификации (Technical Specifications)

### Ключевые файлы (Key Files)
- Frontend: `frontend/src/modules/warehouse/pages/WarehousePage.tsx`
- Backend: `backend/modules/warehouse/routes.js`

### API конечные точки (API Endpoints)
- `GET/POST /api/warehouse/...` — склады и операции (см. `backend/modules/warehouse/routes.js`)
- `/api/warehouse/.../entries`, `.../exits`, `.../transfers`, `.../inventories` — типовые операции

### Схема базы данных (Database Schema)
- `warehouses` — склады
- `warehouse_entries` — поступления
- `warehouse_exits` — списания
- `warehouse_transfers` — перемещения
- `warehouse_inventories` — инвентаризации

## Структура компонентов (Component Structure)
- WarehousePage.tsx (складской учёт)

## Лучшие практики (Best Practices)
- Операции проводить только транзакционно и пересчитывать остатки по факту (не хранить расходящиеся счётчики)
- Движения товаров логировать для аудита (кто, когда, откуда/куда)