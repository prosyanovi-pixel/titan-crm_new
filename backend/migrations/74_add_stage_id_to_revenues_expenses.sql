-- Migration 74: Add stage_id to project_revenues and project_expenses
-- Описание: Добавление связи с этапами для доходов и расходов
-- Дата: 2026-03-30

-- Добавляем stage_id в project_revenues
ALTER TABLE project_revenues 
ADD COLUMN IF NOT EXISTS stage_id INTEGER REFERENCES project_stages(id) ON DELETE SET NULL;

-- Добавляем stage_id в project_expenses
ALTER TABLE project_expenses 
ADD COLUMN IF NOT EXISTS stage_id INTEGER REFERENCES project_stages(id) ON DELETE SET NULL;

-- Индексы
CREATE INDEX IF NOT EXISTS idx_project_revenues_stage ON project_revenues(stage_id);
CREATE INDEX IF NOT EXISTS idx_project_expenses_stage ON project_expenses(stage_id);

-- Комментарии
COMMENT ON COLUMN project_revenues.stage_id IS 'Связь с этапом проекта';
COMMENT ON COLUMN project_expenses.stage_id IS 'Связь с этапом проекта';

-- Запись о миграции
INSERT INTO schema_migrations (filename, applied_at)
VALUES ('74_add_stage_id_to_revenues_expenses', CURRENT_TIMESTAMP)
ON CONFLICT (filename) DO NOTHING;

-- Вывод сообщения об успехе
DO $$
BEGIN
  RAISE NOTICE 'Migration 74: Add stage_id to revenues/expenses completed successfully';
  RAISE NOTICE '  - Table project_revenues: extended (stage_id)';
  RAISE NOTICE '  - Table project_expenses: extended (stage_id)';
  RAISE NOTICE '  - Indexes: 2 created';
END $$;
