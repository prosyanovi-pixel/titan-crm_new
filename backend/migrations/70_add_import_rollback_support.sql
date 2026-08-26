-- Migration: Add rollback support for bank statements import
-- Purpose: Добавляет поддержку отката импорта выписок

-- 1. Добавляем метку сессии импорта для группировки
ALTER TABLE finance_bank_statements 
  ADD COLUMN IF NOT EXISTS import_session_id TEXT;

CREATE INDEX IF NOT EXISTS idx_finance_bank_statements_session 
ON finance_bank_statements(import_session_id);

COMMENT ON COLUMN finance_bank_statements.import_session_id IS 'Идентификатор сессии импорта для группировки и отката';

-- 2. Добавляем флаг отката
ALTER TABLE finance_bank_statements
  ADD COLUMN IF NOT EXISTS is_rolled_back BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_finance_bank_statements_rolled_back
ON finance_bank_statements(is_rolled_back);

COMMENT ON COLUMN finance_bank_statements.is_rolled_back IS 'Флаг отката импорта';

-- 3. Добавляем информацию об откате в выписки
ALTER TABLE finance_bank_statements
  ADD COLUMN IF NOT EXISTS rolled_back_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS rolled_back_by TEXT,
  ADD COLUMN IF NOT EXISTS rollback_reason TEXT;

-- 4. Добавляем session_id в строки выписки
ALTER TABLE finance_statement_lines
  ADD COLUMN IF NOT EXISTS import_session_id TEXT;

CREATE INDEX IF NOT EXISTS idx_finance_statement_lines_session
ON finance_statement_lines(import_session_id);

-- 5. Добавляем таблицу для хранения отчётов импорта
CREATE TABLE IF NOT EXISTS finance_import_sessions (
  id                    TEXT PRIMARY KEY,
  started_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at          TIMESTAMPTZ,
  status                TEXT NOT NULL DEFAULT 'in_progress', -- in_progress, completed, rolled_back
  files_imported        INTEGER NOT NULL DEFAULT 0,
  total_lines           INTEGER NOT NULL DEFAULT 0,
  total_credit          NUMERIC(14,2) NOT NULL DEFAULT 0,
  total_debit           NUMERIC(14,2) NOT NULL DEFAULT 0,
  payments_created      INTEGER NOT NULL DEFAULT 0,
  duplicates_skipped    INTEGER NOT NULL DEFAULT 0,
  contractors_new       INTEGER NOT NULL DEFAULT 0,
  contractors_updated   INTEGER NOT NULL DEFAULT 0,
  new_accounts_added    INTEGER NOT NULL DEFAULT 0,
  warnings_count        INTEGER NOT NULL DEFAULT 0,
  report_json           JSONB,
  rolled_back_at        TIMESTAMPTZ,
  rolled_back_by        TEXT,
  rollback_reason       TEXT,
  imported_by           TEXT
);

CREATE INDEX IF NOT EXISTS idx_finance_import_sessions_status
ON finance_import_sessions(status);

CREATE INDEX IF NOT EXISTS idx_finance_import_sessions_started_at
ON finance_import_sessions(started_at);

COMMENT ON TABLE finance_import_sessions IS 'Сессии импорта банковских выписок с отчётами и поддержкой отката';
