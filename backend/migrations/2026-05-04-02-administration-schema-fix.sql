-- Migration: Administration Schema Fix
-- Created: 2026-05-04
-- Description: Adds missing columns to users table and creates audit log table for the new modular Administration service.

-- 1. Add missing columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS first_name VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_name VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS role_id VARCHAR(50);
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- 2. Backfill data for new columns
-- Map 'name' to 'first_name' as a starting point
UPDATE users SET first_name = name WHERE first_name IS NULL;

-- Map 'role' to 'role_id'
UPDATE users SET role_id = role WHERE role_id IS NULL;

-- Map 'status' to 'is_active'
UPDATE users SET is_active = (status = 'active') WHERE status IS NOT NULL;

-- 3. Create administration_audit_log table
CREATE TABLE IF NOT EXISTS administration_audit_log (
    id SERIAL PRIMARY KEY,
    entity_type VARCHAR(50) NOT NULL,
    entity_id VARCHAR(50) NOT NULL,
    action VARCHAR(50) NOT NULL,
    old_values JSONB,
    new_values JSONB,
    changed_by VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Create trigger for updated_at if not exists
DO $do$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column') THEN
        CREATE FUNCTION update_updated_at_column()
        RETURNS TRIGGER AS $$
        BEGIN
            NEW.updated_at = NOW();
            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
    END IF;
END $do$;

DO $do$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_users_updated_at') THEN
        CREATE TRIGGER update_users_updated_at
        BEFORE UPDATE ON users
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $do$;
