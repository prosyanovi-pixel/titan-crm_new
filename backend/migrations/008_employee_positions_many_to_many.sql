-- Миграция: множественные должности для сотрудников (many-to-many)
-- Позволяет одному сотруднику иметь несколько должностей
-- Например: Генеральный директор + Юрист

-- 1. Создаём таблицу связи
CREATE TABLE IF NOT EXISTS employee_positions (
  id SERIAL PRIMARY KEY,
  employee_id INT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  position_id INT NOT NULL REFERENCES positions(id) ON DELETE CASCADE,
  is_primary BOOLEAN DEFAULT FALSE,  -- основная должность (для отображения в UI)
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(employee_id, position_id)
);

CREATE INDEX IF NOT EXISTS idx_employee_positions_employee ON employee_positions(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_positions_position ON employee_positions(position_id);

-- 2. Мигрируем существующие данные из employees.position_id
INSERT INTO employee_positions (employee_id, position_id, is_primary)
SELECT id, position_id, TRUE
FROM employees
WHERE position_id IS NOT NULL
ON CONFLICT (employee_id, position_id) DO NOTHING;

-- 3. Добавляем VIEW для удобного запроса сотрудников с должностями
CREATE OR REPLACE VIEW v_employees_with_positions AS
SELECT
  e.*,
  p.name AS position_name,
  p.role AS position_role,
  ep.is_primary
FROM employees e
LEFT JOIN employee_positions ep ON ep.employee_id = e.id
LEFT JOIN positions p ON p.id = ep.position_id;

-- 4. Добавляем VIEW для агрегации всех должностей в массив
CREATE OR REPLACE VIEW v_employees_positions_agg AS
SELECT
  e.*,
  COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'position_id', p.id,
        'position_name', p.name,
        'position_role', p.role,
        'is_primary', ep.is_primary
      )
    ) FILTER (WHERE p.id IS NOT NULL),
    '[]'::jsonb
  ) AS positions
FROM employees e
LEFT JOIN employee_positions ep ON ep.employee_id = e.id
LEFT JOIN positions p ON p.id = ep.position_id
GROUP BY e.id;

-- 5. Комментируем
COMMENT ON TABLE employee_positions IS 'Связь сотрудников и должностей (many-to-many, один сотрудник может иметь несколько должностей)';
COMMENT ON COLUMN employee_positions.is_primary IS 'Основная должность — используется для отображения в списках и определения главной роли';

-- 6. Добавляем триггер updated_at для employee_positions (если потребуется)
ALTER TABLE employee_positions ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_employee_positions_updated ON employee_positions;
CREATE TRIGGER trg_employee_positions_updated
  BEFORE UPDATE ON employee_positions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

SELECT 'MIGRATION 008 COMPLETE: employee_positions many-to-many' AS status;
