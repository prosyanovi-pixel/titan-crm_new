-- Migration: Add contract_number to contracts table
-- Version: 308

ALTER TABLE contracts ADD COLUMN IF NOT EXISTS contract_number VARCHAR(100);
CREATE INDEX IF NOT EXISTS idx_contracts_contract_number ON contracts(contract_number);

-- Update existing contracts to have a number if they don't (optional, but good for testing)
-- UPDATE contracts SET contract_number = 'CNT-' || substring(id::text, 1, 8) WHERE contract_number IS NULL;
