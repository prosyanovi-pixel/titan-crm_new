-- Add project_id to contracts table
ALTER TABLE contracts
ADD COLUMN IF NOT EXISTS project_id INTEGER REFERENCES projects(id) ON DELETE SET NULL;

-- Optional: Add an index for faster lookups
CREATE INDEX IF NOT EXISTS idx_contracts_project_id ON contracts(project_id);
