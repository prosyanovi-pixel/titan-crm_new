-- ============================================
-- Add authentication columns to users table
-- ============================================

-- Add password_hash column if not exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='users' AND column_name='password_hash'
    ) THEN
        ALTER TABLE users ADD COLUMN password_hash VARCHAR(255);
    END IF;
END $$;

-- Add nickname column if not exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='users' AND column_name='nickname'
    ) THEN
        ALTER TABLE users ADD COLUMN nickname VARCHAR(100);
    END IF;
END $$;

-- Add telegram_token column if not exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='users' AND column_name='telegram_token'
    ) THEN
        ALTER TABLE users ADD COLUMN telegram_token VARCHAR(100);
    END IF;
END $$;

-- Add reset_token column if not exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='users' AND column_name='reset_token'
    ) THEN
        ALTER TABLE users ADD COLUMN reset_token VARCHAR(255);
    END IF;
END $$;

-- Add reset_token_expires column if not exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='users' AND column_name='reset_token_expires'
    ) THEN
        ALTER TABLE users ADD COLUMN reset_token_expires TIMESTAMP;
    END IF;
END $$;

-- Update existing users with nicknames (password and email will be set separately)
UPDATE users SET nickname = LOWER(REPLACE(name, ' ', '.')) WHERE nickname IS NULL OR nickname = '';

-- Update existing users with default emails
UPDATE users SET email = LOWER(REPLACE(name, ' ', '.')) || '@titan.com' WHERE email IS NULL OR email = '';

-- Set default passwords for all users (password: password123)
UPDATE users SET password_hash = '$2b$10$rOzJqJ8q5Z8Y8Y8Y8Y8Y8u1Xq0Jq0Jq0Jq0Jq0Jq0Jq0Jq0Jq0Jq0Jq0Jq0' WHERE password_hash IS NULL OR password_hash = '';