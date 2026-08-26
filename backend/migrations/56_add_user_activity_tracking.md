# Migration 56: Add User Activity Tracking

## Description
Add columns for tracking user activity and blocking status.

## SQL Statement
```sql
-- Add last_active_at column for tracking user activity
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMP;

-- Add blocking-related columns
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_blocked BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS blocked_at TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS blocked_by VARCHAR(50);
ALTER TABLE users ADD COLUMN IF NOT EXISTS block_reason TEXT;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_users_last_active_at ON users(last_active_at);
CREATE INDEX IF NOT EXISTS idx_users_is_blocked ON users(is_blocked);
```

## Columns
- `last_active_at` - Timestamp of last user activity (updated by middleware)
- `is_blocked` - Whether the user is blocked
- `blocked_at` - When the user was blocked
- `blocked_by` - User ID who blocked this user
- `block_reason` - Reason for blocking

## Notes
- The middleware in index.js updates `last_active_at` every 30 seconds for active users
- Admin can block/unblock users through the admin panel
- Blocked users cannot make API requests (except auth and unblock endpoints)
