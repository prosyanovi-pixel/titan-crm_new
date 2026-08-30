-- ============================================================
-- MIGRATION 357: Add contractor_id to employees (fresh DB)
-- ============================================================
-- Таблица employees создаётся в 346_migrate_company_hr.sql, поэтому на
-- свежей БД миграция 57 (add contractor_id) не может добавить колонку.
-- Данная миграция гарантирует наличие contractor_id + индекса независимо
-- от порядка применения. На существующих БД колонка уже добавлена
-- миграцией 57 — здесь это безопасный no-op.

ALTER TABLE employees
  ADD COLUMN IF NOT EXISTS contractor_id INT REFERENCES contractors(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_employees_contractor_id ON employees(contractor_id);

SELECT 'MIGRATION 357 COMPLETE: contractor_id ensured on employees' AS status;