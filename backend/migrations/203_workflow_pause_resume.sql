-- Migration 203: Add pause and resume capabilities to workflow_executions

-- 1. Add new columns to workflow_executions
ALTER TABLE workflow_executions
ADD COLUMN IF NOT EXISTS resume_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS current_step_index INTEGER DEFAULT 0;

-- 2. Extend status options (we can't easily alter constraints in Postgres without dropping them, 
-- but since 'status' is just a VARCHAR with a default, we don't have a strict check constraint in the original migration).
-- Original: status VARCHAR(50) DEFAULT 'running'
-- We just ensure it can hold 'waiting_approval' and 'paused'.
-- If there was a check constraint, we would drop it and recreate it.
-- Let's add an index for the scheduler to quickly find paused/waiting executions
CREATE INDEX IF NOT EXISTS idx_workflow_executions_status_resume 
ON workflow_executions(status, resume_at);
