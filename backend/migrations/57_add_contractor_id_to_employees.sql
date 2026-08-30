-- ============================================================
-- MIGRATION 57: Add contractor_id to employees table
-- ============================================================
-- Добавляет связь employees -> contractors для синхронизации
-- сотрудников с контрагентами
--
-- ВАЖНО: таблица employees создаётся значительно позже —
-- в миграции 346_migrate_company_hr.sql. Поэтому часть, затрагивающая
-- employees, выполняется только если таблица уже существует (guard).
-- На свежей БД колонка contractor_id и индекс добавляются в миграции
-- 357_add_contractor_id_to_employees.sql (после 346).

DO $$
BEGIN
    -- 1. Добавляем колонку contractor_id (только если существует employees)
    IF EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_name = 'employees' AND table_schema = 'public'
    ) THEN
        ALTER TABLE employees
          ADD COLUMN IF NOT EXISTS contractor_id INT REFERENCES contractors(id) ON DELETE SET NULL;

        -- 2. Добавляем индекс для ускорения JOIN'ов
        CREATE INDEX IF NOT EXISTS idx_employees_contractor_id ON employees(contractor_id);
    END IF;
END $$;

-- 3. Добавляем is_employee в contractors (если ещё нет)
ALTER TABLE contractors
  ADD COLUMN IF NOT EXISTS is_employee BOOLEAN DEFAULT FALSE;

-- 4. Добавляем type в contractors (если ещё нет)
ALTER TABLE contractors
  ADD COLUMN IF NOT EXISTS type VARCHAR(50) DEFAULT 'client';

SELECT 'MIGRATION 57 COMPLETE: contractor_id added to employees' AS status;