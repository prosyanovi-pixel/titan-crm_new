-- Миграция 204: Рефакторинг модуля Юристы (добавление новых полей для дел и претензий)

ALTER TABLE legal_cases ADD COLUMN IF NOT EXISTS first_instance_number VARCHAR(100);
ALTER TABLE legal_cases ADD COLUMN IF NOT EXISTS sent_date DATE;
ALTER TABLE legal_cases ADD COLUMN IF NOT EXISTS response_due_date DATE;

-- Переносим текущие номера дел в поле первой инстанции для судебных дел
UPDATE legal_cases
  SET first_instance_number = case_number
  WHERE type = 'court' 
    AND first_instance_number IS NULL 
    AND case_number IS NOT NULL 
    AND case_number != '';
