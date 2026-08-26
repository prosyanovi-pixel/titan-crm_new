# Database Migrations

This directory contains migration files for setting up and updating the database schema.

## How Migrations Work

The migration system (`migrate.js`) automatically applies migration files in numerical order. It supports both `.sql` and `.md` files.

### Migration Tracking System ✨

**New!** The system now tracks which migrations have been applied using the `schema_migrations` table. This means:

- ✅ **No duplicate execution** - migrations that have already run will be skipped
- ✅ **Fast execution** - only new migrations are applied on subsequent runs  
- ✅ **Safe rollback** - you can see which migrations have been applied
- ✅ **Clear status** - the system reports how many migrations are already applied vs. pending

When you run `npm run migrate`:
1. The system creates the `schema_migrations` table if it doesn't exist
2. Checks which migrations have already been applied
3. Applies only the new/pending migrations
4. Records each successful migration in the tracking table

**Example output:**
```
📋 Ensuring schema_migrations table exists...
📊 Found 47 previously applied migration(s)
📂 Found 48 migration file(s)
🚀 Need to apply 1 new migration(s)
```

### Migration File Format

For `.md` files, the system extracts SQL from code blocks:

```markdown
# Migration XX: Description

## Description
Brief description of what this migration does.

## SQL Statement
```sql
-- Your SQL here
```

## Notes
Additional notes about the migration.

## Rollback (manual only)
```sql
-- Manual rollback if needed:
-- -- Your rollback SQL here (commented out)
-- ```
```

### Important Rules

1. **All SQL code blocks are executed** - The migration runner extracts and executes **every** SQL block found in the file.
2. **Rollback blocks must be commented** - If you include rollback instructions, they must be commented out or marked as "manual only" to prevent automatic execution.
3. **Use `IF NOT EXISTS`** - When adding columns or tables, use `IF NOT EXISTS` to make migrations idempotent (safe to run multiple times).
4. **Numerical ordering** - Files are sorted by filename numerically, so use leading zeros (e.g., `01_`, `02_`, `03_`).

### Example of Correct Migration

```markdown
# Migration 40: Add new_column to table

## Description
Add new_column to store additional data.

## SQL Statement
```sql
ALTER TABLE table_name ADD COLUMN IF NOT EXISTS new_column VARCHAR(255);
```

## Notes
- new_column stores user preferences
- Default value is NULL

## Rollback (manual only)
```sql
-- Manual rollback if needed:
-- ALTER TABLE table_name DROP COLUMN new_column;
-- ```
```

## Running Migrations

```bash
cd backend
node migrate.js
```

The script will:
1. Find all `.sql` and `.md` files in the migrations directory
2. Sort them numerically
3. Extract SQL from markdown files (or use .sql files directly)
4. Execute each SQL statement
5. Report success or failure

## Database Reset

If you need to completely reset the database (useful for development):

```bash
cd backend
npm run reset
```

⚠️ **WARNING**: This will delete ALL data and migration history. You'll need to run migrations and seed data again.

## Migration Files

### System Tables
0. [00_schema_migrations.md](00_schema_migrations.md) - **Migration tracking table** (automatically created)

### Core Tables
1. [01_create_projects_table.md](01_create_projects_table.md) - Projects table schema
3. [02_create_contractors_table.md](02_create_contractors_table.md) - Contractors table schema
4. [03_create_documents_table.md](03_create_documents_table.md) - Documents table schema
5. [04_create_tasks_table.md](04_create_tasks_table.md) - Tasks table schema
6. [05_create_legal_cases_table.md](05_create_legal_cases_table.md) - Legal cases table schema
7. [06_create_mail_table.md](06_create_mail_table.md) - Mail table schema
8. [07_create_users_table.md](07_create_users_table.md) - Users table schema
9. [10_create_calendar_events_table.md](10_create_calendar_events_table.md) - Calendar events table schema

### Reference & Data
10. [09_create_reference_tables.md](09_create_reference_tables.md) - Reference/lookup tables
11. [08_create_initial_data.md](08_create_initial_data.md) - Initial data setup
12. [20_seed_migrated_data.md](20_seed_migrated_data.md) - Seed migrated data
13. [29_seed_access_matrix.md](29_seed_access_matrix.md) - Seed access matrix permissions
14. [38_seed_documents_data.md](38_seed_documents_data.md) - Seed documents data

### Enhancements & Fixes
15. [12_create_user_settings_table.md](12_create_user_settings_table.md) - User settings table
16. [13_create_system_logs_table.md](13_create_system_logs_table.md) - System logs table
17. [14_create_modules_and_tags.md](14_create_modules_and_tags.md) - Modules and tags tables
18. [15_add_color_to_status_tables.md](15_add_color_to_status_tables.md) - Add color columns to status tables
19. [15_add_display_order_to_tags_table.md](15_add_display_order_to_tags_table.md) - Add display order to tags
20. [16_add_user_details.md](16_add_user_details.md) - Add user details columns
21. [17_create_system_settings.md](17_create_system_settings.md) - System settings table
22. [18_create_relationship_types_table.md](18_create_relationship_types_table.md) - Relationship types table
23. [19_create_quick_actions_table.md](19_create_quick_actions_table.md) - Quick actions table
24. [25_update_tags_to_css_variants.md](25_update_tags_to_css_variants.md) - Update tags to CSS variants
25. [26_create_roles_and_permissions_tables.md](26_create_roles_and_permissions_tables.md) - Roles and permissions
26. [27_fix_display_order_columns.md](27_fix_display_order_columns.md) - Fix display order columns
27. [28_standardize_displayorder_columns.md](28_standardize_displayorder_columns.md) - Standardize column names
28. [30_fix_contractor_tags_unique_constraint.md](30_fix_contractor_tags_unique_constraint.md) - Fix contractor tags constraint
29. [31_fix_legal_cases_comprehensive.md](31_fix_legal_cases_comprehensive.md) - Comprehensive legal cases fixes
30. [34_add_missing_quick_actions.md](34_add_missing_quick_actions.md) - Add missing quick actions
31. [35_add_auth_columns_to_users.md](35_add_auth_columns_to_users.md) - Add authentication columns
32. [36_fix_password_hashes.md](36_fix_password_hashes.md) - Fix password hashing
33. [37_force_update_all_password_hashes.md](37_force_update_all_password_hashes.md) - Force update passwords
34. [39_add_stored_filename_to_documents.md](39_add_stored_filename_to_documents.md) - Add stored_filename column

## Migration Order

Migrations are automatically applied in numerical order by the migration script. No manual ordering is required.