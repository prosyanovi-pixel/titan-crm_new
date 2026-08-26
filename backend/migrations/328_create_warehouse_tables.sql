-- Таблица складов
CREATE TABLE IF NOT EXISTS warehouses (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL DEFAULT 'main', -- main, transit, defect
    address VARCHAR(500),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Таблица остатков (inventory balances)
CREATE TABLE IF NOT EXISTS inventory_balances (
    id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    warehouse_id INTEGER NOT NULL REFERENCES warehouses(id) ON DELETE CASCADE,
    quantity NUMERIC(12,3) NOT NULL DEFAULT 0, -- Поддержка кг/метров
    reserved_quantity NUMERIC(12,3) NOT NULL DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(product_id, warehouse_id)
);

-- Таблица истории движений (audit log / transactions)
CREATE TABLE IF NOT EXISTS inventory_transactions (
    id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    warehouse_id INTEGER NOT NULL REFERENCES warehouses(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL, -- receipt (приход), expense (расход), transfer (перемещение), reserve (резерв)
    quantity NUMERIC(12,3) NOT NULL, -- Изменение количества (+ или -)
    reference_id INTEGER, -- Ссылка на документ (ID сделки и т.д.)
    reference_type VARCHAR(100), -- Тип документа ('sale', 'manual' и т.д.)
    notes TEXT,
    created_by VARCHAR(50) REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Таблица заявок на закупку (генерируются при нехватке товара на складе)
CREATE TABLE IF NOT EXISTS purchase_requests (
    id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    requested_quantity NUMERIC(12,3) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending', -- pending, ordered, fulfilled, cancelled
    source_type VARCHAR(50) NOT NULL DEFAULT 'auto', -- auto (сгенерировано), manual (вручную)
    reference_id INTEGER, -- Ссылка на сделку (sale_id) из-за которой создана заявка
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Добавляем дефолтный склад при миграции
INSERT INTO warehouses (name, type) 
SELECT 'Основной склад', 'main'
WHERE NOT EXISTS (SELECT 1 FROM warehouses WHERE name = 'Основной склад');
