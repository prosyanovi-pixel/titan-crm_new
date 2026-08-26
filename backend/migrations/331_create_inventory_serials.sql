-- Скрипт миграции: Создание таблицы для учета серийных номеров

CREATE TABLE IF NOT EXISTS inventory_serials (
    id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    warehouse_id INTEGER NOT NULL REFERENCES warehouses(id) ON DELETE CASCADE,
    serial_number VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'available' CHECK (status IN ('available', 'reserved', 'sold', 'in_transit', 'written_off', 'returned')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(product_id, serial_number) -- Один и тот же серийник не может быть у одного товара дважды
);

-- Индексы для быстрого поиска
CREATE INDEX IF NOT EXISTS idx_inventory_serials_product_id ON inventory_serials(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_serials_warehouse_id ON inventory_serials(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_inventory_serials_serial_number ON inventory_serials(serial_number);
CREATE INDEX IF NOT EXISTS idx_inventory_serials_status ON inventory_serials(status);

-- Создаем таблицу для связи транзакций с серийными номерами
CREATE TABLE IF NOT EXISTS inventory_transaction_serials (
    id SERIAL PRIMARY KEY,
    transaction_id INTEGER NOT NULL REFERENCES inventory_transactions(id) ON DELETE CASCADE,
    serial_id INTEGER NOT NULL REFERENCES inventory_serials(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_inv_tx_serials_tx_id ON inventory_transaction_serials(transaction_id);
CREATE INDEX IF NOT EXISTS idx_inv_tx_serials_serial_id ON inventory_transaction_serials(serial_id);
