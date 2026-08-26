-- Add expiration_date to contracts table
ALTER TABLE contracts
ADD COLUMN IF NOT EXISTS expiration_date DATE NULL;
