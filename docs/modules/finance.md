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

### API конечные точки (все под префиксом `/api/finance`)
- `/api/finance/invoices` — счета (`GET /`, `GET /:id`, `POST /`, `PUT /:id`, `DELETE /:id`, `POST /:id/send`, `POST /:id/recalculate-status`, `POST /:id/generate-document`, `POST /bulk-update`)
- `/api/finance/payments` — платежи (`GET/POST /`, `PUT/DELETE /:id`, `POST /:id/unlink-from-invoice`, `POST /bulk-update`, `POST /bulk-delete`)
- `/api/finance/statements` — банковские выписки (`GET /`, `GET /:id/lines`, `POST /import`, `POST /:id/reconcile`, `PUT /lines/:lineId`, `DELETE /:id`)
- `/api/finance/categories`, `/api/finance/income-categories` — категории расходов/доходов
- `/api/finance/projects` — финансы проектов (`GET /`, `GET /:projectId/summary`)
- `/api/finance/reconciliation-act/:contractorId` — акт сверки
- `/api/finance/reports` — receivables, pl, dds, register
- `/api/finance/settings` — налоговые режимы/ставки, методы распределения, накладные статьи, настройки по умолчанию
- `/api/finance/calendar-payments` — платежи для календаря

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