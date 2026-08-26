-- ============================================
-- Migration 61: Add missing columns to legal_cases table
-- ============================================
-- Adds 'client' and 'outcome' columns that were missing from the original schema

-- Add client column if not exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name='legal_cases' AND column_name='client'
    ) THEN
        ALTER TABLE legal_cases ADD COLUMN client VARCHAR(255) DEFAULT 'ТИТАН';
    END IF;
END $$;

-- Add outcome column if not exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name='legal_cases' AND column_name='outcome'
    ) THEN
        ALTER TABLE legal_cases ADD COLUMN outcome VARCHAR(50);
    END IF;
END $$;
