-- Add condition column to workflow_steps if not exists
ALTER TABLE workflow_steps
  ADD COLUMN IF NOT EXISTS condition JSONB DEFAULT NULL;

COMMENT ON COLUMN workflow_steps.condition IS 
  'Optional condition object: {field, operator, value}. Step is skipped if condition evaluates to false.';
