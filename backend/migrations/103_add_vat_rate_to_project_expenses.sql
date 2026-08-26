-- Migration 103: Add VAT fields to project_expenses
-- Description: Unify expenses with revenues by adding VAT support

ALTER TABLE project_expenses 
ADD COLUMN IF NOT EXISTS vat_rate DECIMAL(5,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS vat_amount DECIMAL(15,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_taxable BOOLEAN DEFAULT TRUE;

COMMENT ON COLUMN project_expenses.vat_rate IS 'Ставка НДС (%)';
COMMENT ON COLUMN project_expenses.vat_amount IS 'Сумма НДС';
COMMENT ON COLUMN project_expenses.is_taxable IS 'Подлежит налогообложению';
