-- Update Product Categories
ALTER TABLE product_categories ADD COLUMN images JSONB DEFAULT '[]'::jsonb;
ALTER TABLE product_categories ADD COLUMN translations JSONB DEFAULT '{}'::jsonb;

-- Create Service Categories
CREATE TABLE service_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    parent_id INTEGER REFERENCES service_categories(id) ON DELETE SET NULL,
    description TEXT,
    images JSONB DEFAULT '[]'::jsonb,
    translations JSONB DEFAULT '{}'::jsonb,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_service_categories_parent_id ON service_categories(parent_id);

-- Create Services
CREATE TABLE services (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    images JSONB DEFAULT '[]'::jsonb,
    translations JSONB DEFAULT '{}'::jsonb,
    category_id INTEGER REFERENCES service_categories(id) ON DELETE SET NULL,
    type VARCHAR(100) NOT NULL, -- e.g., 'pnr', 'installation', 'delivery', 'consulting'
    base_cost DECIMAL(15,2) DEFAULT 0.00,
    cost_type VARCHAR(50) NOT NULL, -- e.g., 'fixed', 'hourly', 'percentage'
    tax_contributions_rate DECIMAL(5,2) DEFAULT 30.00, -- e.g., 30% FOT
    vat_rate DECIMAL(5,2) DEFAULT 0.00,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_services_category_id ON services(category_id);
