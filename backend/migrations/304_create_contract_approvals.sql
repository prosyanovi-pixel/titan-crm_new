-- Migration: Create contract approvals table
-- Version: 304

CREATE TABLE IF NOT EXISTS contract_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  step_number INTEGER NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  assigned_to VARCHAR(50) REFERENCES users(id) ON DELETE SET NULL,
  approved_by VARCHAR(50) REFERENCES users(id) ON DELETE SET NULL,
  rejection_reason TEXT,
  approval_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(contract_id, step_number)
);

CREATE INDEX IF NOT EXISTS idx_contract_approvals_contract_id ON contract_approvals(contract_id);
CREATE INDEX IF NOT EXISTS idx_contract_approvals_status ON contract_approvals(status);
CREATE INDEX IF NOT EXISTS idx_contract_approvals_assigned_to ON contract_approvals(assigned_to);
CREATE INDEX IF NOT EXISTS idx_contract_approvals_approved_by ON contract_approvals(approved_by);
