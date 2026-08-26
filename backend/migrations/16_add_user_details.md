
# Migration 16: Add User Profile Fields and Reset Logic

## Description
Add nickname, telegram_token and password reset fields to users table.

## SQL Statement
```sql
ALTER TABLE users 
ADD COLUMN nickname VARCHAR(50),
ADD COLUMN telegram_token VARCHAR(100),
ADD COLUMN reset_token VARCHAR(100),
ADD COLUMN reset_token_expires TIMESTAMP;

-- Optional: Ensure nickname is unique if provided
CREATE UNIQUE INDEX idx_users_nickname ON users(nickname) WHERE nickname IS NOT NULL;
```
