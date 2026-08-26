-- ============================================
-- Fix contractor_tags table - add unique constraint
-- ============================================

-- First, clean up any duplicate tags that might exist
DELETE FROM contractor_tags WHERE id NOT IN (SELECT MIN(id) FROM contractor_tags GROUP BY contractor_id, tag);

-- Add unique constraint on (contractor_id, tag) to prevent duplicates
ALTER TABLE contractor_tags ADD CONSTRAINT contractor_tags_contractor_tag_unique UNIQUE (contractor_id, tag);
