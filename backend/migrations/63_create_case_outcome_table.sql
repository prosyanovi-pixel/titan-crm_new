-- Migration 63: Create Case Outcome Table
-- Allows customizable case outcomes (results) with colors

CREATE TABLE IF NOT EXISTS case_outcome (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    color VARCHAR(7) DEFAULT '#6B7280',
    display_order INTEGER DEFAULT 0,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default outcomes if table is empty
INSERT INTO case_outcome (id, name, color, display_order, description)
SELECT * FROM (VALUES
    ('won', 'Выиграно', '#10B981', 1, 'Дело выиграно полностью'),
    ('won_partial', 'Выиграно частично', '#F59E0B', 2, 'Дело выиграно частично'),
    ('lost', 'Проиграно', '#EF4444', 3, 'Дело проиграно')
) AS v(id, name, color, display_order, description)
WHERE NOT EXISTS (SELECT 1 FROM case_outcome);
