# Sales Module

> 📄 **Синхронизировано** с [docs/modules/sales.md](../../docs/modules/sales.md) — актуальная компактная спецификация модуля.

## Назначение (Purpose)
Воронка продаж (Sales Pipeline): этапы сделок, отслеживание прохождения сделок по стадиям.

## Основные функции (Core Functions)
- Воронка продаж с этапами (стадиями)
- Управление сделками в рамках этапов
- Сводки по воронке (суммы, конверсия)

## Технические спецификации (Technical Specifications)

### Ключевые файлы (Key Files)
- Frontend: `frontend/src/modules/sales/pages/SalesPipelinePage.tsx`
- Backend: `backend/modules/sales/routes.js`

### API конечные точки (API Endpoints)
- `GET/POST /api/sales/...` — воронка и сделки (см. `backend/modules/sales/routes.js`)
- `/api/sales/:id/stages`, `/:id/stages/summary` — этапы сделки и сводка

### Схема базы данных (Database Schema)
- `sales_stages` — этапы воронки продаж
- Сделки используют связанные сущности (quotes/contracts/payments по конфигурации)

## Структура компонентов (Component Structure)
- SalesPipelinePage.tsx (воронка продаж)

## Лучшие практики (Best Practices)
- Этапы воронки держать настраиваемыми (справочник `sales_stages`)
- Движение по этапам логировать для аналитики конверсии