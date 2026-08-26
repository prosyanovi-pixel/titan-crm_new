# Migration 18: Create Relationship Types Table

## Description
Create a table to store relationship types for contractors (client, partner, supplier, etc.) with module support for settings.

## SQL Statement
```sql
CREATE TABLE relationship_type (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    color VARCHAR(20),
    module VARCHAR(50),
    display_order INTEGER
);

-- Insert default relationship types for contractors module
INSERT INTO relationship_type (id, name, color, module, display_order) VALUES
('client', 'Клиент', '#3B82F6', 'contractors', 1),
('partner', 'Партнер', '#10B981', 'contractors', 2),
('supplier', 'Поставщик', '#F59E0B', 'contractors', 3),
('our', 'Наша организация', '#8B5CF6', 'contractors', 4);
```

## Columns
- `id` - Unique identifier for the relationship type
- `name` - Display name of the relationship type
- `color` - Color code for UI display
- `module` - Module this relationship type belongs to (for settings)
- `display_order` - Order for displaying in UI