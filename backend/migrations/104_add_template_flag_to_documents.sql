-- Migration 104: Add Template Flag to Documents
-- This allows us to mark certain documents as templates for workflow automation

ALTER TABLE documents 
ADD COLUMN IF NOT EXISTS is_template BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS stored_filename VARCHAR(255); -- Mirroring the field used in documents.js for easier access
