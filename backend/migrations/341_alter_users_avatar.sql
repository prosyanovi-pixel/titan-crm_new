-- 341_alter_users_avatar.sql
-- Increase the size of the avatar column to store URLs/paths

ALTER TABLE users ALTER COLUMN avatar TYPE character varying(255);
