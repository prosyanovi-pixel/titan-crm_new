-- Rename legacy tables if they exist to avoid conflict
ALTER TABLE IF EXISTS products RENAME TO legacy_ecommerce_products;
DROP TABLE IF EXISTS product_categories CASCADE;

CREATE TABLE product_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    parent_id INTEGER REFERENCES product_categories(id) ON DELETE SET NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    sku VARCHAR(100) UNIQUE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category_id INTEGER REFERENCES product_categories(id) ON DELETE SET NULL,
    unit VARCHAR(50) DEFAULT 'шт',
    purchase_price DECIMAL(15,2) DEFAULT 0.00,
    currency VARCHAR(3) DEFAULT 'RUB',
    vat_rate DECIMAL(5,2) DEFAULT 0.00,
    dimensions JSONB,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_products_category_id ON products(category_id);
CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_product_categories_parent_id ON product_categories(parent_id);
