# Migration 47: Add Lawyer-specific Columns to Users Table

## Description
Add rating and hourly_rate columns to the users table for lawyer functionality.

## SQL Statement
```sql
-- Add rating column with default value
ALTER TABLE users ADD COLUMN IF NOT EXISTS rating DECIMAL(3,2) DEFAULT 0.00;

-- Add hourly_rate column with default value
ALTER TABLE users ADD COLUMN IF NOT EXISTS hourly_rate DECIMAL(10,2) DEFAULT 0.00;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_rating ON users(rating);
CREATE INDEX IF NOT EXISTS idx_users_hourly_rate ON users(hourly_rate);
```

## Notes
- The rating column is a decimal with 3 digits and 2 decimal places (e.g., 4.50)
- The hourly_rate column is a decimal with 10 digits and 2 decimal places (e.g., 150.00)
- Both columns have default values of 0.00 to prevent null values
- Indexes are added for better query performance on these columns
- Using IF NOT EXISTS to prevent errors if migration is run multiple times