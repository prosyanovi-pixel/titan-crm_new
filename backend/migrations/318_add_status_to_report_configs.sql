-- Migration 318: add status column to report_configs

ALTER TABLE report_configs
  ADD COLUMN IF NOT EXISTS status VARCHAR(100) DEFAULT 'draft';

-- Ensure existing rows have default
UPDATE report_configs SET status = 'draft' WHERE status IS NULL;

CREATE INDEX IF NOT EXISTS idx_report_configs_status ON report_configs(status);
