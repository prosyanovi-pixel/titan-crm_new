-- ============================================
-- Migration 108: Add updated_at column to legal_cases table
-- ============================================
-- Adds 'updated_at' column for tracking when cases were last modified

-- Add updated_at column if not exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name='legal_cases' AND column_name='updated_at'
    ) THEN
        ALTER TABLE legal_cases ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
        -- Create index for faster queries
        CREATE INDEX IF NOT EXISTS idx_legal_cases_updated_at ON legal_cases(updated_at);
    END IF;
END $$;

-- Create or replace function for updating updated_at column
CREATE OR REPLACE FUNCTION update_legal_cases_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS update_legal_cases_updated_at_trigger ON legal_cases;

-- Create trigger to update updated_at on any update
CREATE TRIGGER update_legal_cases_updated_at_trigger
BEFORE UPDATE ON legal_cases
FOR EACH ROW
EXECUTE FUNCTION update_legal_cases_updated_at();
