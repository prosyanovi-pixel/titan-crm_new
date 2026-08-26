# Migration 58: Add Module Settings Structure

## Description
Extend the modules table with a folder field and create a module-specific settings table.
This enables each module to have isolated settings that are dynamically loaded from the module folder.

## SQL Statement
```sql
-- Add folder column to modules table
ALTER TABLE modules ADD COLUMN IF NOT EXISTS folder VARCHAR(100) UNIQUE;
ALTER TABLE modules ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Update existing modules with their folder names
UPDATE modules SET folder = 'contractors' WHERE id = 'contractors' AND folder IS NULL;
UPDATE modules SET folder = 'projects' WHERE id = 'projects' AND folder IS NULL;
UPDATE modules SET folder = 'tasks' WHERE id = 'tasks' AND folder IS NULL;
UPDATE modules SET folder = 'documents' WHERE id = 'documents' AND folder IS NULL;
UPDATE modules SET folder = 'mail' WHERE id = 'mail' AND folder IS NULL;
UPDATE modules SET folder = 'lawyers' WHERE id = 'lawyers' AND folder IS NULL;
UPDATE modules SET folder = 'calendar' WHERE id = 'calendar' AND folder IS NULL;
UPDATE modules SET folder = 'dashboard' WHERE id = 'dashboard' AND folder IS NULL;
UPDATE modules SET folder = 'finance' WHERE id = 'finance' AND folder IS NULL;
UPDATE modules SET folder = 'profile' WHERE id = 'profile' AND folder IS NULL;
UPDATE modules SET folder = 'auth' WHERE id = 'auth' AND folder IS NULL;
UPDATE modules SET folder = 'registry' WHERE id = 'registry' AND folder IS NULL;
UPDATE modules SET folder = 'settings' WHERE id = 'settings' AND folder IS NULL;

-- Create module_settings table to store module-specific configurations
CREATE TABLE IF NOT EXISTS module_settings (
    id SERIAL PRIMARY KEY,
    module_id VARCHAR(50) NOT NULL,
    setting_key VARCHAR(255) NOT NULL,
    value JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (module_id) REFERENCES modules(id) ON DELETE CASCADE,
    UNIQUE(module_id, setting_key)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_module_settings_module_id ON module_settings(module_id);
CREATE INDEX IF NOT EXISTS idx_module_settings_key ON module_settings(module_id, setting_key);
```
