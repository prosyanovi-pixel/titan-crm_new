# Migration 00: Create Schema Migrations Tracking Table

## Description
Creates a table to track which migrations have been applied to the database.
This prevents re-running migrations that have already been executed.

## SQL Statement

```sql
-- Create schema_migrations table if it doesn't exist
CREATE TABLE IF NOT EXISTS schema_migrations (
    filename VARCHAR(255) PRIMARY KEY,
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_schema_migrations_applied_at 
ON schema_migrations(applied_at);
```

## Notes
- This migration must run first (hence the 00_ prefix)
- The table stores the filename and timestamp of each applied migration
- Idempotent - safe to run multiple times
