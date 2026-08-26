# Migration 48: Fix Legal Cases Column Names

## Description
Remove duplicate old-style columns from legal_cases table and keep only the new snake_case columns.

## SQL Statement
```sql
-- Remove old-style columns
ALTER TABLE legal_cases DROP COLUMN IF EXISTS casenumber;
ALTER TABLE legal_cases DROP COLUMN IF EXISTS lawyerid;
ALTER TABLE legal_cases DROP COLUMN IF EXISTS lawyername;
ALTER TABLE legal_cases DROP COLUMN IF EXISTS courtname;
ALTER TABLE legal_cases DROP COLUMN IF EXISTS creationdate;
ALTER TABLE legal_cases DROP COLUMN IF EXISTS startdate;
```

## Rollback
```sql
-- This migration cannot be easily rolled back as data would be lost
-- To rollback, you would need to recreate the old columns and migrate data back