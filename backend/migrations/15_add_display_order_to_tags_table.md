# Migration 11: Add Display Order to Defined Tags Table

## Description
Add `display_order` column to `defined_tags` table for ordering tags in UI.

## SQL Statements

```sql
-- Check if display_order column exists and add it if not
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'defined_tags' AND column_name = 'display_order'
  ) THEN
    ALTER TABLE defined_tags ADD COLUMN display_order INTEGER;
  END IF;
END $$;
```