-- Update products table to split SKU and add characteristics

-- 1. Rename existing sku to sku_internal
ALTER TABLE products RENAME COLUMN sku TO sku_internal;

-- 2. Add sku_external
ALTER TABLE products ADD COLUMN sku_external VARCHAR(100);
CREATE INDEX idx_products_sku_external ON products(sku_external);

-- 3. Add characteristics JSONB
ALTER TABLE products ADD COLUMN characteristics JSONB DEFAULT '[]'::jsonb;
