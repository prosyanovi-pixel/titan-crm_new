-- Migration: Add sync_mode column to mail_accounts table
-- Purpose: Support light/heavy mode for email attachment handling
-- Date: 2024

BEGIN;

-- Add sync_mode column to mail_accounts if it doesn't exist
ALTER TABLE mail_accounts
ADD COLUMN IF NOT EXISTS sync_mode VARCHAR(50) DEFAULT 'light';

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_mail_accounts_sync_mode 
ON mail_accounts(sync_mode);

-- Add sync_mode columns to mail_attachments for tracking
ALTER TABLE mail_attachments
ADD COLUMN IF NOT EXISTS downloaded_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS fetch_error TEXT;

-- Update any existing records to have default sync_mode
UPDATE mail_accounts 
SET sync_mode = 'light' 
WHERE sync_mode IS NULL;

-- Add comment explaining the column
COMMENT ON COLUMN mail_accounts.sync_mode IS 'Sync mode: "light" (metadata only) or "heavy" (download all files)';

COMMIT;
