# Модуль Финансы (finance)

## Назначение
Учёт финансовых операций: счета-фактуры, платежи, банковские выписки, доходы/расходы, налоговые режимы и ставки.

## Основные функции
- Счета и платежи (invoices, payments)
- Категории доходов и расходов
- Банковские выписки и импорт банковских данных
- Налоговые режимы и ставки (включая правила расчёта: НДС 22%, налог на прибыль 20%)
- Прочие накладные расходы и методы распределения
- Финансовые сводки по проектам/сделкам

## Технические спецификации

### Ключевые файлы
- Frontend: `frontend/src/modules/finance/pages/FinancePage.tsx`, `api/finance.api.ts`, `api/finance.keys.ts`
- Backend: `backend/modules/finance/` (routes)

### API конечные точки
- `/api/invoices` — счета (список, создание, статусы)
- `/api/payments` — платежи
- `/api/statements` — банковские выписки
- `/api/income-categories`, `/api/expense-categories` — категории
- `/api/finance/...` — вспомогательные (см. `backend/modules/finance/routes*.js`)

### Схема базы данных
- `finance_invoices`, `finance_invoice_documents`, `finance_invoice_status`
- `finance_payments`
- `finance_bank_statements`, `finance_statement_lines`, `finance_import_sessions`
- `finance_income_categories`, `finance_expense_categories`, `finance_overhead_articles`
- `finance_tax_rates`, `finance_tax_regimes`, `finance_allocation_methods`, `finance_defaults_settings`

## Структура компонентов
- FinancePage.tsx (учёт финансов)

## Лучшие практики
- Ставки по умолчанию: НДС — 22%, налог на прибыль — 20% (если не указано иное)
- Работать с деньгами в целочисленных копейках или с явным округлением, не использовать float