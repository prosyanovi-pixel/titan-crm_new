-- Migration 104: Add missing mail filter columns
-- Purpose: Add delete_mail, forward_to, and apply_label_id columns to mail_filters table
-- These columns are needed for advanced filter actions: delete emails, forward to address, apply label

-- Add missing columns to mail_filters table
ALTER TABLE mail_filters
ADD COLUMN IF NOT EXISTS delete_mail BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS forward_to VARCHAR(255),
ADD COLUMN IF NOT EXISTS apply_label_id VARCHAR(50);

-- Add foreign key constraint for apply_label_id if mail_labels table exists
ALTER TABLE mail_filters
ADD CONSTRAINT fk_mail_filters_label FOREIGN KEY (apply_label_id) 
    REFERENCES mail_labels(id) ON DELETE SET NULL;

-- Create index for forward_to for potential future queries
CREATE INDEX IF NOT EXISTS idx_mail_filters_forward_to ON mail_filters(forward_to);

-- Create index for apply_label_id for performance
CREATE INDEX IF NOT EXISTS idx_mail_filters_label_id ON mail_filters(apply_label_id);

-- Update comment/documentation
COMMENT ON COLUMN mail_filters.delete_mail IS 'Whether to automatically delete emails matching this filter';
COMMENT ON COLUMN mail_filters.forward_to IS 'Email address to forward matching emails to (optional)';
COMMENT ON COLUMN mail_filters.apply_label_id IS 'Label ID to apply to matching emails (optional)';
