-- Migration 71: Project Expenses Table
-- Описание: Создание таблицы для расходов проекта
-- Дата: 2026-03-30
-- Зависимости: 69_projects_finance_phase1.sql, finance_expense_categories

-- ============================================================
-- ЧАСТЬ 1: Таблица project_expenses
-- ============================================================

CREATE TABLE IF NOT EXISTS project_expenses (
    id INTEGER PRIMARY KEY,
    project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    category_id TEXT REFERENCES finance_expense_categories(id) ON DELETE SET NULL,
    contractor_id INTEGER,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    amount DECIMAL(15,2) NOT NULL,
    planned_date DATE NOT NULL,
    actual_date DATE,
    payment_id INTEGER,
    is_approved BOOLEAN DEFAULT FALSE,
    is_paid BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Индексы для производительности
CREATE INDEX IF NOT EXISTS idx_project_expenses_project_id ON project_expenses(project_id);
CREATE INDEX IF NOT EXISTS idx_project_expenses_category_id ON project_expenses(category_id);
CREATE INDEX IF NOT EXISTS idx_project_expenses_planned_date ON project_expenses(planned_date);
CREATE INDEX IF NOT EXISTS idx_project_expenses_approved ON project_expenses(is_approved);
CREATE INDEX IF NOT EXISTS idx_project_expenses_paid ON project_expenses(is_paid);

-- Комментарии
COMMENT ON TABLE project_expenses IS 'Расходы проекта (план/факт)';
COMMENT ON COLUMN project_expenses.project_id IS 'Ссылка на проект';
COMMENT ON COLUMN project_expenses.category_id IS 'Ссылка на категорию расходов из Finance';
COMMENT ON COLUMN project_expenses.contractor_id IS 'Ссылка на контрагента (получателя платежа)';
COMMENT ON COLUMN project_expenses.name IS 'Название расхода';
COMMENT ON COLUMN project_expenses.description IS 'Описание расхода';
COMMENT ON COLUMN project_expenses.amount IS 'Сумма расхода';
COMMENT ON COLUMN project_expenses.planned_date IS 'Плановая дата расхода';
COMMENT ON COLUMN project_expenses.actual_date IS 'Фактическая дата расхода';
COMMENT ON COLUMN project_expenses.payment_id IS 'Ссылка на платёж (finance_payments)';
COMMENT ON COLUMN project_expenses.is_approved IS 'Расход утверждён';
COMMENT ON COLUMN project_expenses.is_paid IS 'Расход оплачен';

-- ============================================================
-- ЧАСТЬ 2: Триггер для обновления updated_at
-- ============================================================

DROP TRIGGER IF EXISTS update_project_expenses_updated_at ON project_expenses;
CREATE TRIGGER update_project_expenses_updated_at
    BEFORE UPDATE ON project_expenses
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- ЧАСТЬ 3: Представление для сводки
-- ============================================================

CREATE OR REPLACE VIEW v_project_expenses_summary AS
SELECT
    project_id,
    COUNT(*) as total_expenses,
    SUM(amount) as total_amount,
    SUM(amount) FILTER (WHERE is_approved) as approved_amount,
    SUM(amount) FILTER (WHERE is_paid) as paid_amount,
    SUM(amount) FILTER (WHERE NOT is_paid AND is_approved) as pending_amount,
    COUNT(*) FILTER (WHERE is_approved) as approved_count,
    COUNT(*) FILTER (WHERE is_paid) as paid_count
FROM project_expenses
GROUP BY project_id;

-- ============================================================
-- ЗАВЕРШЕНИЕ
-- ============================================================

-- Вывод сообщения об успехе
DO $$
BEGIN
    RAISE NOTICE 'Migration 71: Project Expenses Table completed successfully';
    RAISE NOTICE '  - Table project_expenses: created';
    RAISE NOTICE '  - Indexes: 5 created';
    RAISE NOTICE '  - Triggers: 1 created';
    RAISE NOTICE '  - Views: 1 created';
END $$;
