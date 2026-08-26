-- Migration: Create contract files table
-- Version: 305

CREATE TABLE IF NOT EXISTS contract_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  original_name VARCHAR(500) NOT NULL,
  stored_filename VARCHAR(500) NOT NULL UNIQUE,
  file_path VARCHAR(1000) NOT NULL,
  mime_type VARCHAR(100),
  file_size BIGINT,
  file_hash VARCHAR(64),
  uploaded_by VARCHAR(50) NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_contract_files_contract_id ON contract_files(contract_id);
CREATE INDEX IF NOT EXISTS idx_contract_files_uploaded_by ON contract_files(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_contract_files_created_at ON contract_files(created_at);
