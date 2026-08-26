-- Migration 100: Add project_stage_id to tasks table
-- Добавляет связь задач с этапами проектов

-- Добавляем колонку project_stage_id
ALTER TABLE tasks 
ADD COLUMN IF NOT EXISTS project_stage_id INTEGER;

-- Добавляем индекс для ускорения поиска задач по этапу
CREATE INDEX IF NOT EXISTS idx_tasks_project_stage_id ON tasks(project_stage_id);

-- Добавляем внешний ключ (опционально, если таблица project_stages существует)
ALTER TABLE tasks 
ADD CONSTRAINT fk_tasks_project_stage 
FOREIGN KEY (project_stage_id) REFERENCES project_stages(id) 
ON DELETE SET NULL;
