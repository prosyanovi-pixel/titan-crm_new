-- Миграция: создание справочника этапов воронки продаж
CREATE TABLE IF NOT EXISTS sales_stages (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    displayorder INTEGER NOT NULL DEFAULT 0,
    color VARCHAR(20) DEFAULT 'blue',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Вставка базовых этапов воронки продаж
INSERT INTO sales_stages (id, name, displayorder, color) VALUES
('lead', 'Входящий лид', 1, 'gray'),
('negotiation', 'Переговоры', 2, 'blue'),
('quote_prep', 'Подготовка КП', 3, 'orange'),
('contract_review', 'Согласование Договора', 4, 'yellow'),
('won', 'Успешно', 5, 'green'),
('lost', 'Отказ', 6, 'red')
ON CONFLICT (id) DO UPDATE SET 
    name = EXCLUDED.name, 
    displayorder = EXCLUDED.displayorder, 
    color = EXCLUDED.color;
