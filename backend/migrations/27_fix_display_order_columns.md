# Migration 27: Fix Display Order Columns

## Description
Fix inconsistent column naming for display order in reference tables.

## SQL Statements

```sql
-- Fix display order column names to be consistent
-- Some tables use displayOrder, others use displayorder
-- Standardize to displayorder (one word) for consistency

-- Update project_status table
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'project_status' AND column_name = 'displayOrder') THEN
        ALTER TABLE project_status RENAME COLUMN displayOrder TO displayorder;
    END IF;
END $$;

-- Update project_stage table  
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'project_stage' AND column_name = 'displayOrder') THEN
        ALTER TABLE project_stage RENAME COLUMN displayOrder TO displayorder;
    END IF;
END $$;

-- Update priority table
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'priority' AND column_name = 'displayOrder') THEN
        ALTER TABLE priority RENAME COLUMN displayOrder TO displayorder;
    END IF;
END $$;

-- Update contractor_status table
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contractor_status' AND column_name = 'displayOrder') THEN
        ALTER TABLE contractor_status RENAME COLUMN displayOrder TO displayorder;
    END IF;
END $$;

-- Update task_status table
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'task_status' AND column_name = 'displayOrder') THEN
        ALTER TABLE task_status RENAME COLUMN displayOrder TO displayorder;
    END IF;
END $$;

-- Update lawyer_status table
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lawyer_status' AND column_name = 'displayOrder') THEN
        ALTER TABLE lawyer_status RENAME COLUMN displayOrder TO displayorder;
    END IF;
END $$;

-- Update case_status table
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'case_status' AND column_name = 'displayOrder') THEN
        ALTER TABLE case_status RENAME COLUMN displayOrder TO displayorder;
    END IF;
END $$;

-- Update modules table (if exists and has displayOrder)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'modules' AND column_name = 'displayOrder') THEN
        ALTER TABLE modules RENAME COLUMN displayOrder TO displayorder;
    END IF;
END $$;

-- Update relationship_types table (if exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'relationship_types' AND column_name = 'displayOrder') THEN
        ALTER TABLE relationship_types RENAME COLUMN displayOrder TO displayorder;
    END IF;
END $$;
```
