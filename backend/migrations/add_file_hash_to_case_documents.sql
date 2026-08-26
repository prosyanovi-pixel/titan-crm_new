-- Migration: Add file_hash column to case_documents for duplicate detection
-- Created: 2026-03-18

ALTER TABLE IF EXISTS public.case_documents
ADD COLUMN IF NOT EXISTS file_hash character varying(64);

-- Create index for faster lookups by hash
CREATE INDEX IF NOT EXISTS idx_case_documents_file_hash
ON public.case_documents(file_hash)
WHERE file_hash IS NOT NULL;

-- Add comment
COMMENT ON COLUMN public.case_documents.file_hash IS 'SHA-256 hash of file content for duplicate detection';
