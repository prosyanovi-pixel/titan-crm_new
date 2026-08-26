-- Add status column to warehouses, products, services
ALTER TABLE warehouses ADD COLUMN IF NOT EXISTS status VARCHAR(255);
ALTER TABLE products ADD COLUMN IF NOT EXISTS status VARCHAR(255);
ALTER TABLE services ADD COLUMN IF NOT EXISTS status VARCHAR(255);

-- Create warehouse_tags table
CREATE TABLE IF NOT EXISTS warehouse_tags (
    id SERIAL PRIMARY KEY,
    warehouse_id INTEGER NOT NULL REFERENCES warehouses(id) ON DELETE CASCADE,
    tag VARCHAR(255) NOT NULL,
    UNIQUE(warehouse_id, tag)
);

-- Create product_tags table
CREATE TABLE IF NOT EXISTS product_tags (
    id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    tag VARCHAR(255) NOT NULL,
    UNIQUE(product_id, tag)
);

-- Create service_tags table
CREATE TABLE IF NOT EXISTS service_tags (
    id SERIAL PRIMARY KEY,
    service_id INTEGER NOT NULL REFERENCES services(id) ON DELETE CASCADE,
    tag VARCHAR(255) NOT NULL,
    UNIQUE(service_id, tag)
);
