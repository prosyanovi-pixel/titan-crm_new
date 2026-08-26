-- Migration 73: Project Expenses/Revenues Categories
-- Описание: Связь расходов и доходов со статьями Finance
-- Дата: 2026-03-30
-- Зависимости: 71_project_expenses_table.sql, 69_projects_finance_phase1.sql

-- ============================================================
-- ЧАСТЬ 1: Добавляем связь с категориями
-- ============================================================

-- Добавляем category_id в project_expenses
ALTER TABLE project_expenses 
ADD COLUMN IF NOT EXISTS category_id TEXT REFERENCES finance_expense_categories(id) ON DELETE SET NULL;

-- Добавляем income_category_id в project_revenues
ALTER TABLE project_revenues 
ADD COLUMN IF NOT EXISTS income_category_id TEXT;

-- Комментарии
COMMENT ON COLUMN project_expenses.category_id IS 'Статья расходов из Finance (finance_expense_categories)';
COMMENT ON COLUMN project_revenues.income_category_id IS 'Статья доходов (справочник)';

-- ============================================================
-- ЧАСТЬ 2: Создаём справочник статей доходов
-- ============================================================

CREATE TABLE IF NOT EXISTS finance_income_categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    parent_id TEXT REFERENCES finance_income_categories(id) ON DELETE CASCADE,
    color TEXT,
    is_system BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Индексы
CREATE INDEX IF NOT EXISTS idx_finance_income_categories_parent ON finance_income_categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_finance_income_categories_active ON finance_income_categories(is_active);

-- Комментарии
COMMENT ON TABLE finance_income_categories IS 'Статьи доходов для проектов';
COMMENT ON COLUMN finance_income_categories.parent_id IS 'Родительская категория (иерархия)';
COMMENT ON COLUMN finance_income_categories.color IS 'Цвет для визуализации';
COMMENT ON COLUMN finance_income_categories.is_system IS 'Системная категория (нельзя удалить)';

-- ============================================================
-- ЧАСТЬ 3: Seed данные для статей доходов
-- ============================================================

INSERT INTO finance_income_categories (id, name, parent_id, color, is_system, is_active) VALUES
('inc_sales', 'Выручка от реализации', NULL, '#22c55e', true, true),
('inc_sales_products', '  Продажа товаров', 'inc_sales', '#22c55e', false, true),
('inc_sales_services', '  Продажа услуг', 'inc_sales', '#22c55e', false, true),
('inc_other', 'Прочие доходы', NULL, '#eab308', true, true),
('inc_investments', 'Инвестиционные доходы', NULL, '#3b82f6', true, true),
('inc_grants', 'Гранты и субсидии', NULL, '#a855f7', true, true)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- ЧАСТЬ 4: Обновляем существующие записи
-- ============================================================

-- Для расходов: ставим категорию по умолчанию если есть expense категории
UPDATE project_expenses pe
SET category_id = (
  SELECT id FROM finance_expense_categories 
  WHERE kind = 'expense' 
  LIMIT 1
)
WHERE category_id IS NULL
  AND EXISTS (SELECT 1 FROM finance_expense_categories WHERE kind = 'expense');

-- Для доходов: ставим категорию по умолчанию
UPDATE project_revenues pr
SET income_category_id = 'inc_sales'
WHERE income_category_id IS NULL
  AND EXISTS (SELECT 1 FROM finance_income_categories WHERE id = 'inc_sales');

-- ============================================================
-- ЧАСТЬ 5: Представления для удобной работы
-- ============================================================

-- Расходы с категориями
DROP VIEW IF EXISTS v_project_expenses_with_categories;
CREATE OR REPLACE VIEW v_project_expenses_with_categories AS
SELECT 
  pe.*,
  fc.name as category_name,
  fc.color as category_color,
  fc.parent_id as category_parent_id
FROM project_expenses pe
LEFT JOIN finance_expense_categories fc ON pe.category_id = fc.id;

-- Доходы с категориями
DROP VIEW IF EXISTS v_project_revenues_with_categories;
CREATE OR REPLACE VIEW v_project_revenues_with_categories AS
SELECT 
  pr.*,
  ic.name as category_name,
  ic.color as category_color
FROM project_revenues pr
LEFT JOIN finance_income_categories ic ON pr.income_category_id = ic.id;

DROP TRIGGER IF EXISTS update_finance_income_categories_updated_at ON finance_income_categories;
CREATE TRIGGER update_finance_income_categories_updated_at
    BEFORE UPDATE ON finance_income_categories
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();


-- ============================================================
-- ЗАВЕРШЕНИЕ
-- ============================================================

-- Вывод сообщения об успехе
DO $$
DECLARE
  expense_cats INTEGER;
  income_cats INTEGER;
BEGIN
  SELECT COUNT(*) INTO expense_cats FROM finance_expense_categories WHERE kind = 'expense';
  SELECT COUNT(*) INTO income_cats FROM finance_income_categories;
  
  RAISE NOTICE 'Migration 73: Project Expenses/Revenues Categories completed successfully';
  RAISE NOTICE '  - Table project_expenses: extended (category_id)';
  RAISE NOTICE '  - Table project_revenues: extended (income_category_id)';
  RAISE NOTICE '  - Table finance_income_categories: created (%)', income_cats;
  RAISE NOTICE '  - Expense categories available: %', expense_cats;
  RAISE NOTICE '  - Views: 2 created';
END $$;
