-- Migration: Create contract-case linking table
-- Version: 306

CREATE TABLE IF NOT EXISTS contract_cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  case_id VARCHAR(50) NOT NULL REFERENCES legal_cases(id) ON DELETE CASCADE,
  linked_by VARCHAR(50) NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(contract_id, case_id)
);

CREATE INDEX IF NOT EXISTS idx_contract_cases_contract_id ON contract_cases(contract_id);
CREATE INDEX IF NOT EXISTS idx_contract_cases_case_id ON contract_cases(case_id);
CREATE INDEX IF NOT EXISTS idx_contract_cases_created_at ON contract_cases(created_at);
