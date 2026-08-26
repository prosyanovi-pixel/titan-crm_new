-- Добавляем колонку project_stage_id в таблицу tasks
ALTER TABLE tasks 
ADD COLUMN IF NOT EXISTS project_stage_id UUID REFERENCES project_stages(id) ON DELETE SET NULL;

-- Добавляем индекс для быстрого поиска задач по этапу
CREATE INDEX IF NOT EXISTS idx_tasks_project_stage_id ON tasks(project_stage_id);

-- Обновляем комментарий к таблице
COMMENT ON COLUMN tasks.project_stage_id IS 'ID этапа проекта, к которому привязана задача';
