-- Migration 100: Add project_stage_id to tasks table
-- Добавляет связь задач с этапами проектов

-- Добавляем колонку project_stage_id
ALTER TABLE tasks 
ADD COLUMN IF NOT EXISTS project_stage_id INTEGER;

-- Добавляем индекс для ускорения поиска задач по этапу
CREATE INDEX IF NOT EXISTS idx_tasks_project_stage_id ON tasks(project_stage_id);

-- Добавляем внешний ключ (Если его ещё нет — миграция 80 уже могла создать
-- аналогичный FK tasks -> project_stages, повторное ADD CONSTRAINT упадёт)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conrelid = 'tasks'::regclass
          AND contype = 'f'
          AND confrelid = 'project_stages'::regclass
    ) THEN
        ALTER TABLE tasks 
        ADD CONSTRAINT fk_tasks_project_stage 
        FOREIGN KEY (project_stage_id) REFERENCES project_stages(id) 
        ON DELETE SET NULL;
    END IF;
END $$;
