-- Migration 354: Refactor Products, Services and Quotes for Costing and Executors

-- 1. Products: add default supplier/executor
ALTER TABLE products 
  ADD COLUMN IF NOT EXISTS default_executor_type VARCHAR(50), -- 'external'
  ADD COLUMN IF NOT EXISTS default_executor_id INTEGER;

-- 2. Services: add default executor
ALTER TABLE services 
  ADD COLUMN IF NOT EXISTS default_executor_type VARCHAR(50), -- 'internal' (employee/department) or 'external' (subcontractor)
  ADD COLUMN IF NOT EXISTS default_executor_id INTEGER;

-- 3. Quotes: add global executor and margin/cost fields
ALTER TABLE quotes 
  ADD COLUMN IF NOT EXISTS executor_type VARCHAR(50),
  ADD COLUMN IF NOT EXISTS executor_id INTEGER,
  ADD COLUMN IF NOT EXISTS total_cost DECIMAL(15, 2) DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS total_margin DECIMAL(15, 2) DEFAULT 0.00;

-- 4. Quote Items: add line-level executor and margin/cost fields
ALTER TABLE quote_items 
  ADD COLUMN IF NOT EXISTS executor_type VARCHAR(50),
  ADD COLUMN IF NOT EXISTS executor_id INTEGER,
  ADD COLUMN IF NOT EXISTS cost_price DECIMAL(15, 2) DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS total_cost DECIMAL(15, 2) DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS margin DECIMAL(15, 2) DEFAULT 0.00;

-- Optional: Create a view for quote margins
CREATE OR REPLACE VIEW v_quote_margins AS
SELECT 
    q.id as quote_id,
    q.total_amount,
    COALESCE(SUM(qi.total_cost), 0) as calculated_total_cost,
    q.total_amount - COALESCE(SUM(qi.total_cost), 0) as calculated_margin,
    CASE 
        WHEN q.total_amount > 0 THEN ((q.total_amount - COALESCE(SUM(qi.total_cost), 0)) / q.total_amount) * 100 
        ELSE 0 
    END as margin_percent
FROM quotes q
LEFT JOIN quote_items qi ON qi.quote_id = q.id
GROUP BY q.id, q.total_amount;
