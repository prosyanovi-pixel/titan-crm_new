-- Миграция: добавить связь должности с ролью пользователя
-- Должность теперь определяет, какую роль получит пользователь при привязке

ALTER TABLE positions
  ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'user';

-- Обновляем существующие должности стандартными ролями
UPDATE positions SET role = 'admin'  WHERE name IN ('Директор');
UPDATE positions SET role = 'manager' WHERE name IN ('Менеджер', 'Бухгалтер');
UPDATE positions SET role = 'user'   WHERE name IN ('Разработчик');
UPDATE positions SET role = 'manager' WHERE name IN ('Юрист');

COMMENT ON COLUMN positions.role IS 'Роль, которая будет назначена пользователю при привязке к сотруднику с этой должностью';
