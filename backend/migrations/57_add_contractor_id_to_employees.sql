-- ============================================================
-- MIGRATION 57: Add contractor_id to employees table
-- ============================================================
-- Добавляет связь employees -> contractors для синхронизации
-- сотрудников с контрагентами

-- 1. Добавляем колонку contractor_id
ALTER TABLE employees
  ADD COLUMN IF NOT EXISTS contractor_id INT REFERENCES contractors(id) ON DELETE SET NULL;

-- 2. Добавляем индекс для ускорения JOIN'ов
CREATE INDEX IF NOT EXISTS idx_employees_contractor_id ON employees(contractor_id);

-- 3. Добавляем is_employee в contractors (если ещё нет)
ALTER TABLE contractors
  ADD COLUMN IF NOT EXISTS is_employee BOOLEAN DEFAULT FALSE;

-- 4. Добавляем type в contractors (если ещё нет)
ALTER TABLE contractors
  ADD COLUMN IF NOT EXISTS type VARCHAR(50) DEFAULT 'client';

SELECT 'MIGRATION 57 COMPLETE: contractor_id added to employees' AS status;
