-- Migration: Add start_date column to contracts table
-- Version: 316

ALTER TABLE contracts ADD COLUMN IF NOT EXISTS start_date DATE;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_contracts_start_date ON contracts(start_date);

-- Comment for clarity
COMMENT ON COLUMN contracts.start_date IS 'Дата начала действия договора (подписания)';
