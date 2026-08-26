-- Migration 112: Добавление поддержки НДС в счета
-- Дата: 2026-04-26

ALTER TABLE finance_invoices 
ADD COLUMN IF NOT EXISTS vat_rate numeric(5,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS vat_amount numeric(14,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_taxable boolean DEFAULT false;

COMMENT ON COLUMN finance_invoices.vat_rate IS 'Ставка НДС в % (например, 20.00)';
COMMENT ON COLUMN finance_invoices.vat_amount IS 'Сумма НДС в валюте счета';
COMMENT ON COLUMN finance_invoices.is_taxable IS 'Облагается ли счет налогом';

-- Обновляем существующие записи (по умолчанию без НДС)
UPDATE finance_invoices SET is_taxable = false, vat_rate = 0, vat_amount = 0 WHERE is_taxable IS NULL;
