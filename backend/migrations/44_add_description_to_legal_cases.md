# Migration 44: Add description column to legal_cases table

## Description
Add description column to store case descriptions in legal_cases table.

## SQL Statement
```sql
-- Add description column if not exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='legal_cases' AND column_name='description'
    ) THEN
        ALTER TABLE legal_cases ADD COLUMN description TEXT;
    END IF;
END $$;
```

## Columns
- `description` - Text field for storing detailed case information and notes

## Notes
- This migration ensures the description field is available for storing case details
- If the column already exists, this migration will safely skip the addition
