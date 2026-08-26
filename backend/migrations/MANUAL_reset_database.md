# Migration: Reset Database
## Description
Completely reset the database by removing all user-defined objects (tables, functions, triggers, types) while maintaining system integrity.

## SQL Statements
```sql
-- Disable foreign key checks to allow clean removal
-- Privileged statement removed: SET session_replication_role = replica;
-- This DB user doesn't have permission to change session_replication_role.
-- The migration will explicitly drop triggers/tables instead.

-- Remove all user-defined objects
DO $$ 
DECLARE 
r RECORD;
BEGIN
-- Remove all triggers
FOR r IN (
SELECT trigger_name, event_object_table 
FROM information_schema.triggers 
WHERE trigger_schema = 'public'
) 
LOOP
EXECUTE 'DROP TRIGGER IF EXISTS ' || 
quote_ident(r.trigger_name) || ' ON ' || 
quote_ident(r.event_object_table) || ' CASCADE';
END LOOP;

-- Remove all user-defined functions (exclude extension functions)
FOR r IN (
SELECT proname, oid 
FROM pg_proc 
WHERE pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
AND proname NOT LIKE 'pg_%'
AND pronamespace NOT IN (SELECT oid FROM pg_namespace WHERE nspname = 'pg_catalog')
AND NOT EXISTS (
  SELECT 1 FROM pg_extension
  WHERE pg_extension.extnamespace = pg_proc.pronamespace
) 
) 
LOOP
EXECUTE 'DROP FUNCTION IF EXISTS ' || quote_ident(r.proname) || ' CASCADE';
END LOOP;

-- Remove all user-defined tables (except schema_migrations)
FOR r IN (
SELECT tablename 
FROM pg_tables 
WHERE schemaname = 'public'
AND tablename != 'schema_migrations'
) 
LOOP
EXECUTE 'DROP TABLE IF EXISTS ' || quote_ident(r.tablename) || ' CASCADE';
END LOOP;

-- Remove all user-defined composite types (except schema_migrations)
FOR r IN (
SELECT typname 
FROM pg_type 
WHERE typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
AND typtype = 'c'
AND typname != 'schema_migrations'
) 
LOOP
EXECUTE 'DROP TYPE IF EXISTS ' || quote_ident(r.typname) || ' CASCADE';
END LOOP;
END $$;

-- Re-enable foreign key checks
-- Privileged statement removed: SET session_replication_role = DEFAULT;
-- No session parameter change required; cleanup proceeds without it.
```