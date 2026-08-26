-- Create contract_audit_log table
CREATE TABLE IF NOT EXISTS contract_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
    user_id VARCHAR(50) REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(255) NOT NULL,
    details JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_contract_audit_log_contract_id ON contract_audit_log(contract_id);
CREATE INDEX IF NOT EXISTS idx_contract_audit_log_user_id ON contract_audit_log(user_id);