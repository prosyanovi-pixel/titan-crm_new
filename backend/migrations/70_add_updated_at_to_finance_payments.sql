-- Migration: Add updated_at column to finance_payments table
-- Date: 2026-03-26
-- Description: Добавляет колонку updated_at и триггер для автообновления

-- Добавляем колонку updated_at
ALTER TABLE finance_payments
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- Создаем функцию для автообновления updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Создаем триггер для finance_payments
DROP TRIGGER IF EXISTS update_finance_payments_updated_at ON finance_payments;
CREATE TRIGGER update_finance_payments_updated_at
    BEFORE UPDATE ON finance_payments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Добавляем комментарий
COMMENT ON COLUMN finance_payments.updated_at IS 'Время последнего изменения записи';
COMMENT ON TRIGGER update_finance_payments_updated_at ON finance_payments IS 'Автоматически обновляет updated_at при изменении записи';
