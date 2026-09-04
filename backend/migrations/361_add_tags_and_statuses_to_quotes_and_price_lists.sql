-- Migration 361: Add tags and dynamic statuses to quotes and price lists

-- 1. Create quote_status table
CREATE TABLE IF NOT EXISTS quote_status (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    color VARCHAR(20) DEFAULT '#6B7280',
    displayorder INTEGER DEFAULT 0,
    variant VARCHAR(20) DEFAULT 'solid',
    size VARCHAR(20) DEFAULT 'md',
    shape VARCHAR(20) DEFAULT 'rounded',
    icon VARCHAR(50),
    is_glass BOOLEAN DEFAULT false,
    is_gradient BOOLEAN DEFAULT false,
    secondary_color VARCHAR(20),
    is_animated BOOLEAN DEFAULT false
);

-- Seed initial quote statuses (migrating from string values)
INSERT INTO quote_status (id, name, color, displayorder, variant, shape) VALUES
('draft', 'Черновик', '#6B7280', 1, 'soft', 'rounded'),
('sent', 'Отправлено', '#3B82F6', 2, 'soft', 'rounded'),
('accepted', 'Принято', '#10B981', 3, 'soft', 'rounded'),
('rejected', 'Отклонено', '#EF4444', 4, 'soft', 'rounded')
ON CONFLICT (id) DO NOTHING;

-- Modify quotes table to use status_id
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS status_id VARCHAR(50) REFERENCES quote_status(id) ON DELETE SET NULL;

-- Migrate existing status strings to status_id
UPDATE quotes SET status_id = status WHERE status_id IS NULL AND status IN ('draft', 'sent', 'accepted', 'rejected');
-- Set default for others
UPDATE quotes SET status_id = 'draft' WHERE status_id IS NULL;

-- Drop old status column
ALTER TABLE quotes DROP COLUMN IF EXISTS status;

-- Create quote_tags table
CREATE TABLE IF NOT EXISTS quote_tags (
    id SERIAL PRIMARY KEY,
    quote_id INTEGER NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
    tag VARCHAR(255) NOT NULL,
    UNIQUE(quote_id, tag)
);

-- 2. Create price_list_status table
CREATE TABLE IF NOT EXISTS price_list_status (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    color VARCHAR(20) DEFAULT '#6B7280',
    displayorder INTEGER DEFAULT 0,
    variant VARCHAR(20) DEFAULT 'solid',
    size VARCHAR(20) DEFAULT 'md',
    shape VARCHAR(20) DEFAULT 'rounded',
    icon VARCHAR(50),
    is_glass BOOLEAN DEFAULT false,
    is_gradient BOOLEAN DEFAULT false,
    secondary_color VARCHAR(20),
    is_animated BOOLEAN DEFAULT false
);

-- Seed initial price list statuses
INSERT INTO price_list_status (id, name, color, displayorder, variant, shape) VALUES
('active', 'Активный', '#10B981', 1, 'soft', 'rounded'),
('inactive', 'Неактивный', '#6B7280', 2, 'soft', 'rounded')
ON CONFLICT (id) DO NOTHING;

-- Add status_id to price_lists
ALTER TABLE price_lists ADD COLUMN IF NOT EXISTS status_id VARCHAR(50) REFERENCES price_list_status(id) ON DELETE SET NULL;

-- Migrate isActive to status_id
UPDATE price_lists SET status_id = CASE WHEN is_active THEN 'active' ELSE 'inactive' END WHERE status_id IS NULL;

-- Create price_list_tags table
CREATE TABLE IF NOT EXISTS price_list_tags (
    id SERIAL PRIMARY KEY,
    price_list_id INTEGER NOT NULL REFERENCES price_lists(id) ON DELETE CASCADE,
    tag VARCHAR(255) NOT NULL,
    UNIQUE(price_list_id, tag)
);

-- Ensure modules exist before inserting tags
INSERT INTO modules (id, name, icon, displayorder, is_active) VALUES
    ('quotes', 'Коммерческие предложения', 'FileText', 9, true),
    ('price_lists', 'Прайс-листы', 'List', 10, true)
ON CONFLICT (id) DO NOTHING;

-- Seed defined_tags for these modules (defaults)
INSERT INTO defined_tags (id, name, color, module, variant, shape, displayorder) VALUES
('quote_tag_urgent', 'Срочно', '#EF4444', 'quotes', 'soft', 'pill', 1),
('quote_tag_vip', 'VIP клиент', '#F59E0B', 'quotes', 'soft', 'pill', 2),
('price_list_tag_retail', 'Розница', '#3B82F6', 'price_lists', 'soft', 'pill', 1),
('price_list_tag_wholesale', 'Опт', '#10B981', 'price_lists', 'soft', 'pill', 2)
ON CONFLICT (id) DO NOTHING;
