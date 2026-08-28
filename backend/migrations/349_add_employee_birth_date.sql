-- Миграция: добавить колонку birth_date в таблицу employees
ALTER TABLE employees
  ADD COLUMN IF NOT EXISTS birth_date DATE;

COMMENT ON COLUMN employees.birth_date IS 'Дата рождения сотрудника (заполняется по желанию)';
