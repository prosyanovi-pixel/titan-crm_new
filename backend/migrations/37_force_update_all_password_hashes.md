-- ============================================
-- Force update password hashes for ALL users
-- ============================================

-- Update password hashes for ALL users (no WHERE clause)
-- Password: password123
-- Hash generated with bcrypt (10 rounds)

UPDATE users SET password_hash = '$2b$10$iHlVJF5YENfyZBU7zKYbcOLK6xiZQHUYqj1MbZIthOGr2l5iFCOBC';
