-- Create product_status table
CREATE TABLE IF NOT EXISTS product_status (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    color VARCHAR(20) DEFAULT '#6B7280',
    displayorder INTEGER DEFAULT 0,
    variant VARCHAR(20) DEFAULT 'solid',
    size VARCHAR(20) DEFAULT 'md',
    shape VARCHAR(20) DEFAULT 'rounded',
    icon VARCHAR(50),
    is_glass BOOLEAN DEFAULT false,
    is_gradient BOOLEAN DEFAULT false,
    secondary_color VARCHAR(20),
    is_animated BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create service_status table
CREATE TABLE IF NOT EXISTS service_status (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    color VARCHAR(20) DEFAULT '#6B7280',
    displayorder INTEGER DEFAULT 0,
    variant VARCHAR(20) DEFAULT 'solid',
    size VARCHAR(20) DEFAULT 'md',
    shape VARCHAR(20) DEFAULT 'rounded',
    icon VARCHAR(50),
    is_glass BOOLEAN DEFAULT false,
    is_gradient BOOLEAN DEFAULT false,
    secondary_color VARCHAR(20),
    is_animated BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add status_id to products
ALTER TABLE products ADD COLUMN IF NOT EXISTS status_id VARCHAR(50) REFERENCES product_status(id) ON DELETE SET NULL;

-- Add status_id to services
ALTER TABLE services ADD COLUMN IF NOT EXISTS status_id VARCHAR(50) REFERENCES service_status(id) ON DELETE SET NULL;
