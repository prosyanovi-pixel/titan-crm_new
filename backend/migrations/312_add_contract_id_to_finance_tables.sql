-- Add contract_id to finance_invoices table
ALTER TABLE finance_invoices
ADD COLUMN IF NOT EXISTS contract_id UUID REFERENCES contracts(id) ON DELETE SET NULL;

-- Add contract_id to finance_payments table
ALTER TABLE finance_payments
ADD COLUMN IF NOT EXISTS contract_id UUID REFERENCES contracts(id) ON DELETE SET NULL;

-- Optional: Add indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_finance_invoices_contract_id ON finance_invoices(contract_id);
CREATE INDEX IF NOT EXISTS idx_finance_payments_contract_id ON finance_payments(contract_id);
