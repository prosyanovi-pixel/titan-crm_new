-- Добавляем поле payment_number для хранения номера платежного поручения
ALTER TABLE finance_payments 
ADD COLUMN IF NOT EXISTS payment_number TEXT;

-- Добавляем индекс для быстрого поиска по номеру
CREATE INDEX IF NOT EXISTS idx_finance_payments_payment_number 
ON finance_payments (payment_number);

-- Добавляем комментарий
COMMENT ON COLUMN finance_payments.payment_number IS 'Номер платежного поручения (из выписки или вручную)';

-- Заполняем существующие платежи номерами из строк выписки если они были привязаны
UPDATE finance_payments fp
SET payment_number = sl.reference
FROM finance_statement_lines sl
WHERE sl.payment_id = fp.id
  AND sl.reference IS NOT NULL
  AND fp.payment_number IS NULL;
