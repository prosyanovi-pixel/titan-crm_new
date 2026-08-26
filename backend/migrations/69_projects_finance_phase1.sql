-- Migration 69: Projects Finance Phase 1
-- Описание: Создание таблиц для управления этапами проекта, доходами и графиком платежей
-- Дата: 2026-03-30
-- Зависимости: 01_create_projects_table.md, 43_add_parent_id_column_to_projects

-- ============================================================
-- ЧАСТЬ 1: Расширение таблицы projects
-- ============================================================

-- Добавляем новые поля в таблицу projects (идемпотентно)
DO $$
BEGIN
    -- start_date
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'start_date') THEN
        ALTER TABLE projects ADD COLUMN start_date DATE;
    END IF;
    
    -- end_date
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'end_date') THEN
        ALTER TABLE projects ADD COLUMN end_date DATE;
    END IF;
    
    -- budget_currency
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'budget_currency') THEN
        ALTER TABLE projects ADD COLUMN budget_currency VARCHAR(3) DEFAULT 'RUB';
    END IF;
    
    -- tax_regime_id
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'tax_regime_id') THEN
        ALTER TABLE projects ADD COLUMN tax_regime_id INTEGER;
    END IF;
    
    -- overhead_allocated
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'overhead_allocated') THEN
        ALTER TABLE projects ADD COLUMN overhead_allocated DECIMAL(15,2) DEFAULT 0;
    END IF;
    
    -- profit_actual
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'profit_actual') THEN
        ALTER TABLE projects ADD COLUMN profit_actual DECIMAL(15,2) DEFAULT 0;
    END IF;
    
    -- profit_plan
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'profit_plan') THEN
        ALTER TABLE projects ADD COLUMN profit_plan DECIMAL(15,2) DEFAULT 0;
    END IF;
    
    -- wip_amount
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'wip_amount') THEN
        ALTER TABLE projects ADD COLUMN wip_amount DECIMAL(15,2) DEFAULT 0;
    END IF;
    
    -- created_at
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'created_at') THEN
        ALTER TABLE projects ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
    END IF;
    
    -- updated_at
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'updated_at') THEN
        ALTER TABLE projects ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
    END IF;
END $$;

-- Индексы для производительности
CREATE INDEX IF NOT EXISTS idx_projects_start_date ON projects(start_date);
CREATE INDEX IF NOT EXISTS idx_projects_end_date ON projects(end_date);
CREATE INDEX IF NOT EXISTS idx_projects_tax_regime_id ON projects(tax_regime_id);
CREATE INDEX IF NOT EXISTS idx_projects_created_at ON projects(created_at);
CREATE INDEX IF NOT EXISTS idx_projects_updated_at ON projects(updated_at);

-- Комментарии к полям
COMMENT ON COLUMN projects.start_date IS 'Дата начала проекта';
COMMENT ON COLUMN projects.end_date IS 'Дата окончания проекта';
COMMENT ON COLUMN projects.budget_currency IS 'Валюта бюджета (RUB, USD, EUR)';
COMMENT ON COLUMN projects.tax_regime_id IS 'Ссылка на режим налогообложения из Finance';
COMMENT ON COLUMN projects.overhead_allocated IS 'Распределённые накладные расходы';
COMMENT ON COLUMN projects.profit_actual IS 'Фактическая прибыль';
COMMENT ON COLUMN projects.profit_plan IS 'Плановая прибыль';
COMMENT ON COLUMN projects.wip_amount IS 'Незавершённое производство (WIP)';

-- ============================================================
-- ЧАСТЬ 2: Таблица project_stages (этапы проекта)
-- ============================================================

-- Создаём таблицу только если она не существует
-- Примечание: project_stage (ед.ч.) - это справочник статусов (todo, in_progress, review, done)
-- project_stages (мн.ч.) - это этапы конкретного проекта
CREATE TABLE IF NOT EXISTS project_stages (
    id INTEGER PRIMARY KEY,
    project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    planned_start_date DATE,
    planned_end_date DATE,
    progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    is_completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMP,
    order_index INTEGER NOT NULL DEFAULT 0,
    budget DECIMAL(15,2) DEFAULT 0,
    budget_used DECIMAL(15,2) DEFAULT 0,
    responsible_user_id INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Индексы для project_stages
CREATE INDEX IF NOT EXISTS idx_project_stages_project_id ON project_stages(project_id);
CREATE INDEX IF NOT EXISTS idx_project_stages_order ON project_stages(project_id, order_index);
CREATE INDEX IF NOT EXISTS idx_project_stages_dates ON project_stages(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_project_stages_completed ON project_stages(is_completed);

-- Комментарии
COMMENT ON TABLE project_stages IS 'Этапы проекта';
COMMENT ON COLUMN project_stages.project_id IS 'Ссылка на проект';
COMMENT ON COLUMN project_stages.name IS 'Название этапа';
COMMENT ON COLUMN project_stages.description IS 'Описание этапа';
COMMENT ON COLUMN project_stages.start_date IS 'Фактическая дата начала';
COMMENT ON COLUMN project_stages.end_date IS 'Фактическая дата окончания';
COMMENT ON COLUMN project_stages.planned_start_date IS 'Плановая дата начала';
COMMENT ON COLUMN project_stages.planned_end_date IS 'Плановая дата окончания';
COMMENT ON COLUMN project_stages.progress IS 'Прогресс выполнения (0-100%)';
COMMENT ON COLUMN project_stages.is_completed IS 'Флаг завершения этапа';
COMMENT ON COLUMN project_stages.completed_at IS 'Дата и время завершения';
COMMENT ON COLUMN project_stages.order_index IS 'Порядковый номер этапа';
COMMENT ON COLUMN project_stages.budget IS 'Бюджет этапа';
COMMENT ON COLUMN project_stages.budget_used IS 'Использовано бюджета';
COMMENT ON COLUMN project_stages.responsible_user_id IS 'Ответственный пользователь';

-- ============================================================
-- ЧАСТЬ 3: Таблица project_revenues (доходы проекта)
-- ============================================================

CREATE TABLE IF NOT EXISTS project_revenues (
    id INTEGER PRIMARY KEY,
    project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    stage_id INTEGER REFERENCES project_stages(id) ON DELETE SET NULL,
    contractor_id INTEGER,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    amount DECIMAL(15,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'RUB',
    vat_rate DECIMAL(5,2) DEFAULT 0,
    vat_amount DECIMAL(15,2) DEFAULT 0,
    planned_date DATE NOT NULL,
    actual_date DATE,
    invoice_id INTEGER,
    payment_id INTEGER,
    status VARCHAR(50) DEFAULT 'planned' CHECK (status IN ('planned', 'invoiced', 'received', 'overdue', 'cancelled')),
    overdue_since DATE,
    is_taxable BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Индексы для project_revenues
CREATE INDEX IF NOT EXISTS idx_project_revenues_project_id ON project_revenues(project_id);
CREATE INDEX IF NOT EXISTS idx_project_revenues_stage_id ON project_revenues(stage_id);
CREATE INDEX IF NOT EXISTS idx_project_revenues_status ON project_revenues(status);
CREATE INDEX IF NOT EXISTS idx_project_revenues_planned_date ON project_revenues(planned_date);
CREATE INDEX IF NOT EXISTS idx_project_revenues_actual_date ON project_revenues(actual_date);
CREATE INDEX IF NOT EXISTS idx_project_revenues_overdue ON project_revenues(overdue_since) WHERE status = 'overdue';

-- Комментарии
COMMENT ON TABLE project_revenues IS 'Доходы проекта (план/факт)';
COMMENT ON COLUMN project_revenues.project_id IS 'Ссылка на проект';
COMMENT ON COLUMN project_revenues.stage_id IS 'Ссылка на этап проекта (опционально)';
COMMENT ON COLUMN project_revenues.contractor_id IS 'Ссылка на контрагента';
COMMENT ON COLUMN project_revenues.name IS 'Название дохода';
COMMENT ON COLUMN project_revenues.description IS 'Описание';
COMMENT ON COLUMN project_revenues.amount IS 'Сумма дохода';
COMMENT ON COLUMN project_revenues.currency IS 'Валюта';
COMMENT ON COLUMN project_revenues.vat_rate IS 'Ставка НДС (%)';
COMMENT ON COLUMN project_revenues.vat_amount IS 'Сумма НДС';
COMMENT ON COLUMN project_revenues.planned_date IS 'Плановая дата поступления';
COMMENT ON COLUMN project_revenues.actual_date IS 'Фактическая дата поступления';
COMMENT ON COLUMN project_revenues.invoice_id IS 'Ссылка на счёт (finance_invoices)';
COMMENT ON COLUMN project_revenues.payment_id IS 'Ссылка на платёж (finance_payments)';
COMMENT ON COLUMN project_revenues.status IS 'Статус дохода';
COMMENT ON COLUMN project_revenues.overdue_since IS 'Дата возникновения просрочки';
COMMENT ON COLUMN project_revenues.is_taxable IS 'Подлежит налогообложению';

-- ============================================================
-- ЧАСТЬ 4: Таблица project_payment_schedule (график платежей)
-- ============================================================

CREATE TABLE IF NOT EXISTS project_payment_schedule (
    id INTEGER PRIMARY KEY,
    project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    stage_id INTEGER REFERENCES project_stages(id) ON DELETE SET NULL,
    revenue_id INTEGER REFERENCES project_revenues(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    amount DECIMAL(15,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'RUB',
    due_date DATE NOT NULL,
    paid_date DATE,
    paid_amount DECIMAL(15,2) DEFAULT 0,
    payment_method VARCHAR(50) DEFAULT 'bank' CHECK (payment_method IN ('bank', 'cash', 'card', 'other')),
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'partial', 'overdue', 'cancelled')),
    overdue_since DATE,
    is_early BOOLEAN DEFAULT FALSE,
    payment_reference VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Индексы для project_payment_schedule
CREATE INDEX IF NOT EXISTS idx_project_payment_schedule_project_id ON project_payment_schedule(project_id);
CREATE INDEX IF NOT EXISTS idx_project_payment_schedule_stage_id ON project_payment_schedule(stage_id);
CREATE INDEX IF NOT EXISTS idx_project_payment_schedule_revenue_id ON project_payment_schedule(revenue_id);
CREATE INDEX IF NOT EXISTS idx_project_payment_schedule_status ON project_payment_schedule(status);
CREATE INDEX IF NOT EXISTS idx_project_payment_schedule_due_date ON project_payment_schedule(due_date);
CREATE INDEX IF NOT EXISTS idx_project_payment_schedule_overdue ON project_payment_schedule(overdue_since) WHERE status = 'overdue';

-- Комментарии
COMMENT ON TABLE project_payment_schedule IS 'График платежей проекта';
COMMENT ON COLUMN project_payment_schedule.project_id IS 'Ссылка на проект';
COMMENT ON COLUMN project_payment_schedule.stage_id IS 'Ссылка на этап проекта';
COMMENT ON COLUMN project_payment_schedule.revenue_id IS 'Ссылка на доход';
COMMENT ON COLUMN project_payment_schedule.name IS 'Название платежа';
COMMENT ON COLUMN project_payment_schedule.description IS 'Описание';
COMMENT ON COLUMN project_payment_schedule.amount IS 'Сумма к оплате';
COMMENT ON COLUMN project_payment_schedule.currency IS 'Валюта';
COMMENT ON COLUMN project_payment_schedule.due_date IS 'Дата оплаты по плану';
COMMENT ON COLUMN project_payment_schedule.paid_date IS 'Фактическая дата оплаты';
COMMENT ON COLUMN project_payment_schedule.paid_amount IS 'Фактически оплаченная сумма';
COMMENT ON COLUMN project_payment_schedule.payment_method IS 'Способ оплаты';
COMMENT ON COLUMN project_payment_schedule.status IS 'Статус платежа';
COMMENT ON COLUMN project_payment_schedule.overdue_since IS 'Дата возникновения просрочки';
COMMENT ON COLUMN project_payment_schedule.is_early IS 'Оплачено досрочно';
COMMENT ON COLUMN project_payment_schedule.payment_reference IS 'Номер платёжного документа';

-- ============================================================
-- ЧАСТЬ 5: Триггеры для автоматического обновления updated_at
-- ============================================================

-- Функция для обновления updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Триггеры для projects
DROP TRIGGER IF EXISTS update_projects_updated_at ON projects;
CREATE TRIGGER update_projects_updated_at
    BEFORE UPDATE ON projects
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Триггеры для project_stages
DROP TRIGGER IF EXISTS update_project_stages_updated_at ON project_stages;
CREATE TRIGGER update_project_stages_updated_at
    BEFORE UPDATE ON project_stages
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Триггеры для project_revenues
DROP TRIGGER IF EXISTS update_project_revenues_updated_at ON project_revenues;
CREATE TRIGGER update_project_revenues_updated_at
    BEFORE UPDATE ON project_revenues
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Триггеры для project_payment_schedule
DROP TRIGGER IF EXISTS update_project_payment_schedule_updated_at ON project_payment_schedule;
CREATE TRIGGER update_project_payment_schedule_updated_at
    BEFORE UPDATE ON project_payment_schedule
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- ЧАСТЬ 6: Функции для автоматического расчёта статусов
-- ============================================================

-- Функция для обновления статуса платежа при изменении дат
CREATE OR REPLACE FUNCTION update_payment_schedule_status()
RETURNS TRIGGER AS $$
BEGIN
    -- Если оплачено полностью
    IF NEW.paid_amount >= NEW.amount THEN
        NEW.status := 'paid';
        NEW.paid_date := COALESCE(NEW.paid_date, CURRENT_DATE);
        NEW.overdue_since := NULL;
    -- Если оплачено частично
    ELSIF NEW.paid_amount > 0 THEN
        NEW.status := 'partial';
    -- Если срок прошёл и не оплачено
    ELSIF NEW.due_date < CURRENT_DATE THEN
        NEW.status := 'overdue';
        NEW.overdue_since := COALESCE(NEW.overdue_since, NEW.due_date);
    -- Если срок ещё не наступил
    ELSIF NEW.due_date >= CURRENT_DATE THEN
        NEW.status := 'pending';
        NEW.overdue_since := NULL;
    END IF;
    
    -- Проверка на досрочную оплату
    IF NEW.paid_date IS NOT NULL AND NEW.paid_date < NEW.due_date THEN
        NEW.is_early := TRUE;
    ELSE
        NEW.is_early := FALSE;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Триггер для автоматического обновления статуса платежа
DROP TRIGGER IF EXISTS payment_schedule_auto_status ON project_payment_schedule;
CREATE TRIGGER payment_schedule_auto_status
    BEFORE INSERT OR UPDATE ON project_payment_schedule
    FOR EACH ROW
    EXECUTE FUNCTION update_payment_schedule_status();

-- Функция для обновления статуса дохода
CREATE OR REPLACE FUNCTION update_project_revenue_status()
RETURNS TRIGGER AS $$
BEGIN
    -- Если есть фактическая дата поступления
    IF NEW.actual_date IS NOT NULL THEN
        NEW.status := 'received';
        NEW.overdue_since := NULL;
    -- Если выставлен счёт
    ELSIF NEW.invoice_id IS NOT NULL THEN
        NEW.status := 'invoiced';
    -- Если срок прошёл
    ELSIF NEW.planned_date < CURRENT_DATE THEN
        NEW.status := 'overdue';
        NEW.overdue_since := COALESCE(NEW.overdue_since, NEW.planned_date);
    -- Если срок ещё не наступил
    ELSE
        NEW.status := 'planned';
        NEW.overdue_since := NULL;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Триггер для автоматического обновления статуса дохода
DROP TRIGGER IF EXISTS project_revenue_auto_status ON project_revenues;
CREATE TRIGGER project_revenue_auto_status
    BEFORE INSERT OR UPDATE ON project_revenues
    FOR EACH ROW
    EXECUTE FUNCTION update_project_revenue_status();

-- ============================================================
-- ЧАСТЬ 7: Начальные данные (последовательности)
-- ============================================================

-- Инициализация последовательностей для ID
DO $$
DECLARE
    max_id INTEGER;
BEGIN
    -- project_stages
    SELECT COALESCE(MAX(id), 0) + 1 INTO max_id FROM project_stages;
    PERFORM setval('project_stages_id_seq', max_id, FALSE);
    
    -- project_revenues
    SELECT COALESCE(MAX(id), 0) + 1 INTO max_id FROM project_revenues;
    PERFORM setval('project_revenues_id_seq', max_id, FALSE);
    
    -- project_payment_schedule
    SELECT COALESCE(MAX(id), 0) + 1 INTO max_id FROM project_payment_schedule;
    PERFORM setval('project_payment_schedule_id_seq', max_id, FALSE);
EXCEPTION
    WHEN undefined_table THEN
        -- Последовательности будут созданы автоматически при первом INSERT
        NULL;
END $$;

-- ============================================================
-- ЧАСТЬ 8: Представления для удобной работы
-- ============================================================

-- Представление: сводка по этапам проекта
CREATE OR REPLACE VIEW v_project_stages_summary AS
SELECT
    ps.project_id,
    COUNT(*) AS total_stages,
    COUNT(*) FILTER (WHERE ps.is_completed) AS completed_stages,
    COUNT(*) FILTER (WHERE NOT ps.is_completed) AS pending_stages,
    AVG(ps.progress) AS avg_progress,
    SUM(ps.budget) AS total_budget,
    SUM(ps.budget_used) AS total_budget_used,
    MIN(ps.start_date) AS earliest_start,
    MAX(ps.end_date) AS latest_end
FROM project_stages ps
GROUP BY ps.project_id;

-- Представление: сводка по доходам проекта
CREATE OR REPLACE VIEW v_project_revenues_summary AS
SELECT
    pr.project_id,
    COUNT(*) AS total_revenues,
    SUM(pr.amount) FILTER (WHERE pr.status = 'planned') AS planned_amount,
    SUM(pr.amount) FILTER (WHERE pr.status = 'received') AS received_amount,
    SUM(pr.amount) FILTER (WHERE pr.status = 'overdue') AS overdue_amount,
    SUM(pr.vat_amount) AS total_vat,
    COUNT(*) FILTER (WHERE pr.status = 'overdue') AS overdue_count
FROM project_revenues pr
GROUP BY pr.project_id;

-- Представление: сводка по графику платежей
CREATE OR REPLACE VIEW v_project_payment_schedule_summary AS
SELECT
    pps.project_id,
    COUNT(*) AS total_payments,
    SUM(pps.amount) AS total_amount,
    SUM(pps.paid_amount) AS total_paid,
    SUM(pps.amount) FILTER (WHERE pps.status = 'pending') AS pending_amount,
    SUM(pps.amount) FILTER (WHERE pps.status = 'overdue') AS overdue_amount,
    COUNT(*) FILTER (WHERE pps.status = 'overdue') AS overdue_count,
    COUNT(*) FILTER (WHERE pps.status = 'paid') AS paid_count,
    MIN(pps.due_date) FILTER (WHERE pps.status IN ('pending', 'overdue')) AS next_due_date
FROM project_payment_schedule pps
GROUP BY pps.project_id;

-- ============================================================
-- ЗАВЕРШЕНИЕ
-- ============================================================

-- Вывод сообщения об успехе
DO $$
BEGIN
    RAISE NOTICE 'Migration 69: Projects Finance Phase 1 completed successfully';
    RAISE NOTICE '  - Table projects: extended with 10 new columns';
    RAISE NOTICE '  - Table project_stages: created';
    RAISE NOTICE '  - Table project_revenues: created';
    RAISE NOTICE '  - Table project_payment_schedule: created';
    RAISE NOTICE '  - Triggers: 6 created';
    RAISE NOTICE '  - Views: 3 created';
END $$;
