# Схема базы данных TITAN CRM

## Обзор
TITAN CRM использует PostgreSQL. Доступ из backend — через обёртку `backend/db.js` (автоматическая конверсия `snake_case` колонок ↔ `camelCase` в JS-объектах), работать через `db.query`, а не напрямую через `pg`.

Актуальную структуру можно выгрузить командой `npm --prefix backend run db:structure:json` (результат — `backend/db-structure.json`).

## Архитектура базы данных

### Основные таблицы (по доменам)

#### Пользователи и доступ
- `users` — пользователи (email, nickname, password_hash, role, telegram_token, is_blocked, last_active_at)
- `roles`, `permissions` — роли и права (матрица доступа, роль admin с правом `*`)
- `user_settings`, `system_settings`, `module_settings`, `modules` — настройки

#### Контрагенты
- `contractors` — контрагенты (включая физлиц и иностранных, `group_id`, налоговые поля)
- `contractor_contacts`, `contractor_bank_accounts`, `contractor_tags`, `contractor_status`, `contractor_type`, `contractor_tax_history`
- `legal_form`, `legal_form_groups`, `relationship_type` — справочники

#### Проекты и задачи
- `projects`, `project_status`, `project_stages`, `project_stage`, `project_expenses`, `project_revenues`, `project_payment_schedule`
- `tasks`, `task_status`, `subtasks`, `priority`

#### Договоры
- `contracts`, `contract_status`, `contract_templates`, `contract_versions`, `contract_approvals`, `contract_files`, `contract_cases`, `contract_audit_log`, `contract_payment_status`

#### Документы
- `documents`, `document_versions`, `share_links`

#### Юридические дела
- `legal_cases`, `case_instances`, `case_documents`, `case_notes`, `case_events`, `case_status`, `case_type`, `case_outcome`, `case_third_parties`, `case_financial_details`
- `courts`, `judges`, `specialization`, `lawyer_status` — справочники юристов

#### Финансы
- `finance_invoices`, `finance_payments`, `finance_invoice_documents`, `finance_invoice_status`, `finance_bank_statements`, `finance_statement_lines`, `finance_import_sessions`
- Справочники: `finance_income_categories`, `finance_expense_categories`, `finance_overhead_articles`, `finance_allocation_methods`, `finance_tax_rates`, `finance_tax_regimes`, `finance_ndfl_brackets`, `finance_currencies`, `finance_exchange_rates`, `finance_defaults_settings`

#### Продажи и каталог
- `quotes`, `quote_items`, `sales_stages`
- `products`, `product_categories`, `product_components`, `product_status`, `product_tags`
- `services`, `service_categories`, `service_status`, `service_tags`
- `price_lists`, `price_list_items`

#### Склад
- `warehouses`, `warehouse_tags`, `inventory_balances`, `inventory_transactions`, `inventory_serials`, `inventory_transaction_serials`, `purchase_requests`

#### Почта
- `mail`, `mail_accounts`, `mail_folders`, `mail_attachments`, `mail_labels`, `mail_labels_mapping`, `mail_filters`, `mail_filter_conditions`, `mail_templates`, `mail_send_queue`, `mail_sync_state`, `mail_sync_logs`, `mail_label`

#### Маркетинг
- `marketing_campaigns`, `marketing_status`, `marketing_type`

#### Календарь
- `calendar_events`, `calendar_event_notifications`, `calendar_status`, `event_type`

#### Уведомления и коммуникации
- `notifications`
- `chats`, `chat_messages`, `comments`

#### Юридические справочники и прочее
- `employees`, `departments`, `positions`, `employee_positions`, `company_profile`, `company_accounts`
- `quick_actions`, `defined_tags`, `audit_log`, `administration_audit_log`, `system_logs`
- `workflow`-таблицы: `workflows`, `workflow_steps`, `workflow_executions`, `workflow_execution_logs`
- `report_configs`, `report_status`, `ai_insights`
- `enrichment_jobs`, `enrichment_stats`
- `schema_migrations` — журнал применённых миграций

## Миграции
Все изменения схемы реализуются через миграции в `backend/migrations/` (применяются командой `npm --prefix backend run migrate`, журнал — таблица `schema_migrations`).

### Пример
```sql
-- Migration: Create users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    ...
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

## Индексы
Для оптимизации производительности создаются индексы:
- Индексы на полях, используемых в WHERE и JOIN
- Индексы на полях сортировки
- Уникальные индексы на полях с уникальными значениями

## Безопасность
- Все пароли хэшируются с использованием bcrypt
- Используются параметризованные запросы для предотвращения SQL-инъекций
- Проверка прав на уровне API (middleware `checkPermission`), а не на уровне таблиц
