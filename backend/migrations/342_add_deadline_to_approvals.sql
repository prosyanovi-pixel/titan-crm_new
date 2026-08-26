-- Migration: Add deadline_date to contract approvals
-- Version: 342

ALTER TABLE contract_approvals
ADD COLUMN IF NOT EXISTS deadline_date TIMESTAMP WITH TIME ZONE;
