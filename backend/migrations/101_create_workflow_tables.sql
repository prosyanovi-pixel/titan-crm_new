-- Migration 101: Create Workflow Engine Tables

-- 1. Table workflows
CREATE TABLE workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  trigger_type VARCHAR(50) NOT NULL, -- 'schedule', 'event', 'webhook'
  trigger_config JSONB, -- For schedule: {"cron": "0 */15 * * * *"}, For event: {"eventName": "email_received"}
  status VARCHAR(50) DEFAULT 'draft', -- 'draft', 'active', 'paused'
  created_by VARCHAR(50) REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_workflows_status_trigger ON workflows(status, trigger_type);

-- 2. Table workflow_steps
CREATE TABLE workflow_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id UUID REFERENCES workflows(id) ON DELETE CASCADE,
  step_order INTEGER NOT NULL,
  module VARCHAR(100) NOT NULL, -- 'email', 'finance', 'legal_case', 'filesystem'
  action VARCHAR(100) NOT NULL, -- 'download_email', 'update_status'
  action_config JSONB NOT NULL DEFAULT '{}', -- action specific configs
  delay_seconds INTEGER DEFAULT 0, -- delay before step execution
  on_fail VARCHAR(20) DEFAULT 'stop', -- 'stop', 'retry', 'skip'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_workflow_steps_order ON workflow_steps(workflow_id, step_order);

-- 3. Table workflow_executions
CREATE TABLE workflow_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id UUID REFERENCES workflows(id) ON DELETE CASCADE,
  status VARCHAR(50) DEFAULT 'running', -- 'running', 'completed', 'failed', 'paused'
  trigger_event_payload JSONB, -- what triggered the workflow
  context JSONB DEFAULT '{}', -- context accumulated between steps
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  finished_at TIMESTAMP WITH TIME ZONE
);

-- 4. Table workflow_execution_logs
CREATE TABLE workflow_execution_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  execution_id UUID REFERENCES workflow_executions(id) ON DELETE CASCADE,
  step_id UUID REFERENCES workflow_steps(id) ON DELETE SET NULL,
  status VARCHAR(50), -- 'success', 'error'
  output_data JSONB, -- response from action
  error_message TEXT,
  executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
