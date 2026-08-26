-- Add include_subfolders setting for mail accounts

ALTER TABLE mail_accounts
  ADD COLUMN IF NOT EXISTS include_subfolders BOOLEAN DEFAULT FALSE;
