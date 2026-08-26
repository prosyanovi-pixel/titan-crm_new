-- Migration: Add color to project_stage (reference table)
-- Описание: Добавление поля color в справочник стадий проекта
-- Дата: 2026-XX-XX

DO $$
BEGIN
    -- Add color column if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'project_stage' AND column_name = 'color'
    ) THEN
        ALTER TABLE project_stage ADD COLUMN color VARCHAR(50);
    END IF;
END $$;

COMMENT ON COLUMN project_stage.color IS 'CSS класс цвета или HEX код для визуализации стадии';

-- Set default colors for existing stages
UPDATE project_stage SET color = '#6B7280' WHERE color IS NULL;
