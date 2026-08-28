-- Migration: Product Bundles (Комплектации)

ALTER TABLE products 
ADD COLUMN IF NOT EXISTS is_composite BOOLEAN DEFAULT false;

CREATE TABLE IF NOT EXISTS product_components (
    id SERIAL PRIMARY KEY,
    parent_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    component_id INTEGER NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    quantity INTEGER NOT NULL DEFAULT 1,
    write_off_from_warehouse BOOLEAN DEFAULT true,
    is_included_in_price BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(parent_id, component_id)
);

-- Index for searching components of a parent
CREATE INDEX IF NOT EXISTS idx_product_components_parent ON product_components(parent_id);
