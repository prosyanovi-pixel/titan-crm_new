# Migration 28: Standardize Display Order Column Names

## Description
Standardize all display order columns to use 'displayorder' (one word, no underscore) for consistency.

## SQL Statements

```sql
-- Rename display_order to displayorder in tables that use underscore
-- modules table
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'modules' AND column_name = 'display_order') THEN
        ALTER TABLE modules RENAME COLUMN display_order TO displayorder;
    END IF;
END $$;

-- defined_tags table
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'defined_tags' AND column_name = 'display_order') THEN
        ALTER TABLE defined_tags RENAME COLUMN display_order TO displayorder;
    END IF;
END $$;

-- relationship_type table
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'relationship_type' AND column_name = 'display_order') THEN
        ALTER TABLE relationship_type RENAME COLUMN display_order TO displayorder;
    END IF;
END $$;
```
