/**
 * Инициализация схемы БД для финансового модуля
 */

const db = require('../../db');

let schemaReady = false;

const ensureSchema = async () => {
  if (schemaReady) return;

  await db.query(`
    CREATE TABLE IF NOT EXISTS finance_invoice_status (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      color TEXT,
      displayorder INTEGER NOT NULL DEFAULT 0
    );
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS finance_invoices (
      id TEXT PRIMARY KEY,
      identifier TEXT UNIQUE NOT NULL,
      contractor_id INTEGER,
      project_id INTEGER,
      lawyer_user_id TEXT,
      source_task_id TEXT,
      title TEXT NOT NULL,
      description TEXT,
      currency TEXT NOT NULL DEFAULT 'RUB',
      amount_total NUMERIC(14,2) NOT NULL DEFAULT 0,
      amount_paid NUMERIC(14,2) NOT NULL DEFAULT 0,
      amount_due NUMERIC(14,2) NOT NULL DEFAULT 0,
      issue_date DATE NOT NULL,
      due_date DATE NOT NULL,
      status TEXT NOT NULL DEFAULT 'draft',
      calendar_event_id TEXT,
      created_by TEXT,
      updated_by TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS finance_payments (
      id TEXT PRIMARY KEY,
      kind TEXT NOT NULL,
      invoice_id TEXT,
      project_id INTEGER,
      contractor_id INTEGER,
      amount NUMERIC(14,2) NOT NULL,
      currency TEXT NOT NULL DEFAULT 'RUB',
      payment_date DATE NOT NULL,
      method TEXT,
      comment TEXT,
      created_by TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);

  // Drop the old relation constraint if it still exists (was too strict)
  await db.query(`
    ALTER TABLE finance_payments
    DROP CONSTRAINT IF EXISTS finance_payments_relation_chk;
  `).catch(() => {});

  await db.query(`
    CREATE TABLE IF NOT EXISTS finance_invoice_documents (
      id TEXT PRIMARY KEY,
      invoice_id TEXT NOT NULL,
      document_type TEXT NOT NULL,
      document_id TEXT,
      template_payload JSONB,
      status TEXT NOT NULL DEFAULT 'generated',
      created_by TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);

  await db.query(`
    INSERT INTO finance_invoice_status (id, name, color, displayorder)
    VALUES
      ('draft', 'Черновик', '#94A3B8', 10),
      ('sent', 'Отправлен', '#3B82F6', 20),
      ('partial_paid', 'Оплачен частично', '#F59E0B', 30),
      ('paid', 'Оплачен', '#22C55E', 40),
      ('overdue', 'Просрочен', '#EF4444', 50)
    ON CONFLICT (id) DO UPDATE
    SET name = EXCLUDED.name,
        color = EXCLUDED.color,
        displayorder = EXCLUDED.displayorder;
  `);

  // --- Migration 51: extend finance module ---

  // invoice_type column
  await db.query(`
    ALTER TABLE finance_invoices
      ADD COLUMN IF NOT EXISTS invoice_type TEXT NOT NULL DEFAULT 'outgoing';
  `);

  // Expense / income categories (DDS)
  await db.query(`
    CREATE TABLE IF NOT EXISTS finance_expense_categories (
      id         TEXT PRIMARY KEY,
      name       TEXT NOT NULL,
      kind       TEXT NOT NULL DEFAULT 'expense',
      parent_id  TEXT REFERENCES finance_expense_categories(id),
      color      TEXT,
      is_system  BOOLEAN NOT NULL DEFAULT false,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);

  await db.query(`
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
  `);

  // task_id on payments
  await db.query(`
    ALTER TABLE finance_payments
      ADD COLUMN IF NOT EXISTS task_id TEXT;
  `);

  // category_id on payments
  await db.query(`
    ALTER TABLE finance_payments
      ADD COLUMN IF NOT EXISTS category_id TEXT;
  `);

  // Bank statements (header)
  await db.query(`
    CREATE TABLE IF NOT EXISTS finance_bank_statements (
      id           TEXT PRIMARY KEY,
      file_name    TEXT,
      import_type  TEXT NOT NULL DEFAULT 'csv',
      account      TEXT,
      date_from    DATE,
      date_to      DATE,
      total_credit NUMERIC(14,2) NOT NULL DEFAULT 0,
      total_debit  NUMERIC(14,2) NOT NULL DEFAULT 0,
      status       TEXT NOT NULL DEFAULT 'pending',
      imported_by  TEXT,
      created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);

  // Bank statement lines
  await db.query(`
    CREATE TABLE IF NOT EXISTS finance_statement_lines (
      id               TEXT PRIMARY KEY,
      statement_id     TEXT NOT NULL REFERENCES finance_bank_statements(id) ON DELETE CASCADE,
      line_date        DATE NOT NULL,
      amount           NUMERIC(14,2) NOT NULL,
      direction        TEXT NOT NULL,
      counterparty     TEXT,
      purpose          TEXT,
      reference        TEXT,
      invoice_id       TEXT,
      payment_id       TEXT,
      reconcile_status TEXT NOT NULL DEFAULT 'unmatched',
      created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);

  // category_id on statement lines
  await db.query(`
    ALTER TABLE finance_statement_lines
      ADD COLUMN IF NOT EXISTS category_id TEXT;
  `);

  // contractor_id, counterparty_inn, account_number on statement lines
  await db.query(`
    ALTER TABLE finance_statement_lines
      ADD COLUMN IF NOT EXISTS contractor_id INTEGER;
  `);
  await db.query(`
    ALTER TABLE finance_statement_lines
      ADD COLUMN IF NOT EXISTS counterparty_inn TEXT;
  `);
  await db.query(`
    ALTER TABLE finance_statement_lines
      ADD COLUMN IF NOT EXISTS account_number TEXT;
  `);

  schemaReady = true;
};

module.exports = { ensureSchema };
