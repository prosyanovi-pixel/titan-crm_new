# Migration 12: Enhance Calendar Status Styling

## Description
Adds missing styling columns to calendar_status table to support the unified StatusEditor.

## SQL Statement
```sql
ALTER TABLE calendar_status ADD COLUMN IF NOT EXISTS variant VARCHAR(20) DEFAULT 'solid';
ALTER TABLE calendar_status ADD COLUMN IF NOT EXISTS size VARCHAR(10) DEFAULT 'md';
ALTER TABLE calendar_status ADD COLUMN IF NOT EXISTS shape VARCHAR(20) DEFAULT 'rounded';
ALTER TABLE calendar_status ADD COLUMN IF NOT EXISTS icon VARCHAR(50);
ALTER TABLE calendar_status ADD COLUMN IF NOT EXISTS is_glass BOOLEAN DEFAULT FALSE;
ALTER TABLE calendar_status ADD COLUMN IF NOT EXISTS is_gradient BOOLEAN DEFAULT FALSE;
ALTER TABLE calendar_status ADD COLUMN IF NOT EXISTS secondary_color VARCHAR(7);
ALTER TABLE calendar_status ADD COLUMN IF NOT EXISTS is_animated BOOLEAN DEFAULT FALSE;
```
