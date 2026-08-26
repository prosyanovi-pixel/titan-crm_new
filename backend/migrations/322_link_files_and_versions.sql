-- Migration: Link files to versions and versions to approvals
-- Version: 322

-- 1. Add file_id to contract_versions
ALTER TABLE contract_versions 
ADD COLUMN IF NOT EXISTS file_id UUID REFERENCES contract_files(id) ON DELETE SET NULL;

-- 2. Add version_id to contract_approvals
ALTER TABLE contract_approvals
ADD COLUMN IF NOT EXISTS version_id UUID REFERENCES contract_versions(id) ON DELETE CASCADE;

-- 3. Create indexes
CREATE INDEX IF NOT EXISTS idx_contract_versions_file_id ON contract_versions(file_id);
CREATE INDEX IF NOT EXISTS idx_contract_approvals_version_id ON contract_approvals(version_id);
