-- Add headless CMS and warehouse-related fields to products

-- 1. Images array (store URLs/paths)
ALTER TABLE products ADD COLUMN images JSONB DEFAULT '[]'::jsonb;

-- 2. Translations (e.g. {"en": {"name": "...", "description": "..."}})
ALTER TABLE products ADD COLUMN translations JSONB DEFAULT '{}'::jsonb;

-- 3. Ratings (for website display)
ALTER TABLE products ADD COLUMN website_rating NUMERIC(3, 2) DEFAULT 0.00;
ALTER TABLE products ADD COLUMN website_reviews_count INTEGER DEFAULT 0;
