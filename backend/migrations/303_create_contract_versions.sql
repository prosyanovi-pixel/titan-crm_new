-- Migration: Create contract versions table
-- Version: 303

CREATE TABLE IF NOT EXISTS contract_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  name VARCHAR(500) NOT NULL,
  description TEXT,
  content TEXT NOT NULL,
  changes JSONB,
  created_by VARCHAR(50) NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(contract_id, version_number)
);

CREATE INDEX IF NOT EXISTS idx_contract_versions_contract_id ON contract_versions(contract_id);
CREATE INDEX IF NOT EXISTS idx_contract_versions_version_number ON contract_versions(contract_id, version_number);
CREATE INDEX IF NOT EXISTS idx_contract_versions_created_at ON contract_versions(created_at);
