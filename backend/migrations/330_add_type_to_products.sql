-- Add type column to products table
ALTER TABLE products ADD COLUMN IF NOT EXISTS type character varying(100);
