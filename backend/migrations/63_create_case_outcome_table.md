# Migration 63: Create Case Outcome Table

## Description
Create a table to store customizable case outcomes (results) with colors.
This allows users to manage outcome options via Settings UI.

## SQL Statement
```sql
CREATE TABLE IF NOT EXISTS case_outcome (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    color VARCHAR(7) DEFAULT '#6B7280',
    display_order INTEGER DEFAULT 0,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default outcomes
INSERT INTO case_outcome (id, name, color, display_order, description) VALUES
    ('won', 'Выиграно', '#10B981', 1, 'Дело выиграно полностью'),
    ('won_partial', 'Выиграно частично', '#F59E0B', 2, 'Дело выиграно частично'),
    ('lost', 'Проиграно', '#EF4444', 3, 'Дело проиграно')
ON CONFLICT (name) DO NOTHING;
```

## Notes
- Similar structure to status tables (contractor_status, case_status, etc.)
- Default outcomes match existing hardcoded values in LegalCase type
- Color scheme: green for won, amber for partial, red for lost
- Users can add custom outcomes via Settings UI
