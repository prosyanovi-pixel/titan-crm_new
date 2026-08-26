-- Migration: Add template_id to contracts table
-- Version: 309

ALTER TABLE contracts ADD COLUMN IF NOT EXISTS template_id UUID REFERENCES contract_templates(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_contracts_template_id ON contracts(template_id);
