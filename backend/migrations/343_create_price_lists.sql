-- Migration: Create Price Lists and Price List Items tables
-- Stage 1: Price Lists

CREATE TABLE IF NOT EXISTS price_lists (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'RUB',
    is_active BOOLEAN DEFAULT true,
    is_default BOOLEAN DEFAULT false,
    valid_from TIMESTAMP WITH TIME ZONE,
    valid_to TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS price_list_items (
    id SERIAL PRIMARY KEY,
    price_list_id INTEGER NOT NULL REFERENCES price_lists(id) ON DELETE CASCADE,
    item_type VARCHAR(50) NOT NULL CHECK (item_type IN ('product', 'service')),
    item_id INTEGER NOT NULL,
    price NUMERIC(15, 2) NOT NULL DEFAULT 0,
    currency VARCHAR(3) NOT NULL DEFAULT 'RUB',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(price_list_id, item_type, item_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_price_list_items_type_id ON price_list_items(item_type, item_id);
CREATE INDEX IF NOT EXISTS idx_price_list_items_price_list ON price_list_items(price_list_id);

-- Insert default price list
INSERT INTO price_lists (name, is_default, currency) 
VALUES ('Базовый розничный', true, 'RUB');
