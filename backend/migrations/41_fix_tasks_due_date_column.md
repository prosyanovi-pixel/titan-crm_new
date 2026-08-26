# Migration 41: Fix Tasks Due Date Column Name

## Description
Fix the column name for due date in the tasks table to match the code expectations. The migration file defined it as `dueDate` but the code was trying to use `due_date`.

## SQL Statement
```sql
-- Rename the dueDate column to due_date to match code expectations if it exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tasks' AND column_name='dueDate') THEN
        ALTER TABLE tasks RENAME COLUMN "dueDate" TO due_date;
    END IF;
END $$;

-- Also fix the assigneeInitials column name if it exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tasks' AND column_name='assigneeInitials') THEN
        ALTER TABLE tasks RENAME COLUMN "assigneeInitials" TO assignee_initials;
    END IF;
END $$;
```

## Columns Updated
- `dueDate` → `due_date`
- `assigneeInitials` → `assignee_initials`

## Notes
- This migration ensures the database schema matches what the application code expects
- The column names are being standardized to snake_case format