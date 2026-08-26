# Migration 51 — Расширение модуля Финансы

## Цель
Добавить поддержку:
- Типа счёта (исходящий/входящий)
- Статей расходов (ДДС-категории)
- Банковских выписок и строк выписки (импорт из 1С / CSV)
- Акт сверки

## SQL

```sql
-- 1. Тип счёта: 'outgoing' (исходящий клиенту) | 'incoming' (от поставщика)
ALTER TABLE finance_invoices
  ADD COLUMN IF NOT EXISTS invoice_type TEXT NOT NULL DEFAULT 'outgoing';

-- 2. Статьи движения денежных средств (ДДС)
CREATE TABLE IF NOT EXISTS finance_expense_categories (
  id        TEXT PRIMARY KEY,
  name      TEXT NOT NULL,
  kind      TEXT NOT NULL DEFAULT 'expense', -- 'income' | 'expense'
  parent_id TEXT REFERENCES finance_expense_categories(id),
  color     TEXT,
  is_system BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Системные статьи
INSERT INTO finance_expense_categories (id, name, kind, is_system) VALUES
  ('inc_clients',   'Поступления от клиентов',  'income',  true),
  ('inc_other',     'Прочие поступления',        'income',  true),
  ('exp_salary',    'Зарплата и выплаты',        'expense', true),
  ('exp_taxes',     'Налоги и сборы',            'expense', true),
  ('exp_rent',      'Аренда',                    'expense', true),
  ('exp_purchase',  'Закупки / материалы',       'expense', true),
  ('exp_marketing', 'Маркетинг и реклама',       'expense', true),
  ('exp_other',     'Прочие расходы',            'expense', true)
ON CONFLICT (id) DO NOTHING;

-- 3. Привязка платежей к статье ДДС
ALTER TABLE finance_payments
  ADD COLUMN IF NOT EXISTS category_id TEXT REFERENCES finance_expense_categories(id);

-- 4. Банковские выписки (шапка)
CREATE TABLE IF NOT EXISTS finance_bank_statements (
  id           TEXT PRIMARY KEY,
  file_name    TEXT,
  import_type  TEXT NOT NULL DEFAULT 'csv', -- 'csv' | '1c_txt'
  account      TEXT,                         -- расчётный счёт / наименование банка
  date_from    DATE,
  date_to      DATE,
  total_credit NUMERIC(14,2) NOT NULL DEFAULT 0,
  total_debit  NUMERIC(14,2) NOT NULL DEFAULT 0,
  status       TEXT NOT NULL DEFAULT 'pending', -- 'pending' | 'reconciled'
  imported_by  TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. Строки выписки
CREATE TABLE IF NOT EXISTS finance_statement_lines (
  id              TEXT PRIMARY KEY,
  statement_id    TEXT NOT NULL REFERENCES finance_bank_statements(id) ON DELETE CASCADE,
  line_date       DATE NOT NULL,
  amount          NUMERIC(14,2) NOT NULL,
  direction       TEXT NOT NULL, -- 'credit' (приход) | 'debit' (расход)
  counterparty    TEXT,
  purpose         TEXT,          -- назначение платежа
  reference       TEXT,          -- номер п/п
  invoice_id      TEXT REFERENCES finance_invoices(id),     -- после реконсиляции
  payment_id      TEXT REFERENCES finance_payments(id),     -- после разноса
  reconcile_status TEXT NOT NULL DEFAULT 'unmatched', -- 'unmatched' | 'auto' | 'manual'
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
```
