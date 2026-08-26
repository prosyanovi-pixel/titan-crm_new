# Migration 45: Ensure all legal_cases columns are correctly named

## Description
Ensure all needed columns exist in legal_cases table with proper snake_case naming and that camelCase columns from original migration are either in use or can be replaced.

## SQL Statement
```sql
-- Ensure lawyer_id column exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='legal_cases' AND column_name='lawyer_id'
    ) THEN
        ALTER TABLE legal_cases ADD COLUMN lawyer_id VARCHAR(50);
    END IF;
END $$;

-- Ensure plaintiff column exists  
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='legal_cases' AND column_name='plaintiff'
    ) THEN
        ALTER TABLE legal_cases ADD COLUMN plaintiff VARCHAR(255);
    END IF;
END $$;

-- Ensure type column exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='legal_cases' AND column_name='type'
    ) THEN
        ALTER TABLE legal_cases ADD COLUMN type VARCHAR(50);
    END IF;
END $$;

-- Ensure deadline column exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='legal_cases' AND column_name='deadline'
    ) THEN
        ALTER TABLE legal_cases ADD COLUMN deadline VARCHAR(50);
    END IF;
END $$;

-- Ensure price column exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='legal_cases' AND column_name='price'
    ) THEN
        ALTER TABLE legal_cases ADD COLUMN price DECIMAL(15,2);
    END IF;
END $$;
```

## Notes
- This migration ensures all columns referenced by the API exist in the database
- Uses IF NOT EXISTS to safely handle multiple runs
- All column names follow snake_case convention for consistency
