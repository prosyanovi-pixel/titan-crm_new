
# Migration 12: Create User Settings Table

## Description
Create a table to store user-specific UI settings (column visibility, tab order, etc.).

## SQL Statement
```sql
CREATE TABLE user_settings (
    user_id VARCHAR(50) NOT NULL,
    setting_key VARCHAR(100) NOT NULL,
    value JSONB NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, setting_key)
);
```

## Columns
- `user_id` - ID of the user (references users table logically)
- `setting_key` - Unique key for the setting (e.g., 'projects-table-columns')
- `value` - JSON data containing the configuration
- `updated_at` - Timestamp of last update
