-- Добавляем поле overdue_since для отслеживания даты просрочки
ALTER TABLE finance_invoices 
ADD COLUMN IF NOT EXISTS overdue_since DATE;

-- Добавляем индекс для быстрого поиска просроченных счетов
CREATE INDEX IF NOT EXISTS idx_finance_invoices_overdue_since 
ON finance_invoices (overdue_since) 
WHERE status = 'overdue';

-- Обновляем существующие просроченные счета
UPDATE finance_invoices 
SET overdue_since = due_date 
WHERE status = 'overdue' 
  AND overdue_since IS NULL 
  AND due_date < CURRENT_DATE;

COMMENT ON COLUMN finance_invoices.overdue_since IS 'Дата, с которой счет просрочен (совпадает с due_date если счет не оплачен и дата прошла)';
