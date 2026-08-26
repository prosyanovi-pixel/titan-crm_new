-- ============================================
-- Fix password hashes for all users
-- ============================================

-- Update password hashes for all users
-- Password: password123
-- Hash generated with bcrypt (10 rounds)

UPDATE users SET password_hash = '$2b$10$iHlVJF5YENfyZBU7zKYbcOLK6xiZQHUYqj1MbZIthOGr2l5iFCOBC' WHERE password_hash IS NULL OR password_hash = '';
