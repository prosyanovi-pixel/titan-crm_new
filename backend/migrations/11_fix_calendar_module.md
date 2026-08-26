# Migration 11: Fix Calendar Module

## Description
Adds calendar_status table and missing columns to calendar_events table.

## SQL Statement
```sql
-- Create calendar_status table
CREATE TABLE IF NOT EXISTS calendar_status (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    displayorder INTEGER DEFAULT 0,
    color VARCHAR(50)
);

-- Seed calendar_status
INSERT INTO calendar_status (id, name, displayorder, color) VALUES
    ('pending', 'Ожидание', 1, '#F59E0B'),
    ('confirmed', 'Подтверждено', 2, '#10B981'),
    ('cancelled', 'Отменено', 3, '#EF4444'),
    ('completed', 'Завершено', 4, '#6B7280')
ON CONFLICT (id) DO UPDATE SET 
    name = EXCLUDED.name, 
    displayorder = EXCLUDED.displayorder,
    color = EXCLUDED.color;

-- Add project_id and priority columns to calendar_events
ALTER TABLE calendar_events ADD COLUMN IF NOT EXISTS project_id INTEGER REFERENCES projects(id);
ALTER TABLE calendar_events ADD COLUMN IF NOT EXISTS priority VARCHAR(20) DEFAULT 'Medium';

-- Ensure foreign keys exist for client and assignee (they should already exist from migration 10)
-- But let's make sure 'client' is an integer referencing contractors
-- and 'assignee' is a varchar referencing users
```
