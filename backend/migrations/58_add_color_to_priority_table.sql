-- Migration 58: Add Color Column to Priority Table
-- Description: Add color column to support custom priority colors via Settings UI

-- Add color column (уже могла быть добавлена md-версией миграции 58)
ALTER TABLE priority ADD COLUMN IF NOT EXISTS color VARCHAR(7);

-- Set default colors for existing priorities
UPDATE priority SET color = '#EF4444' WHERE id = 'High';
UPDATE priority SET color = '#F59E0B' WHERE id = 'Medium';
UPDATE priority SET color = '#3B82F6' WHERE id = 'Low';

-- Verify the changes
SELECT id, name, color FROM priority ORDER BY displayorder;
