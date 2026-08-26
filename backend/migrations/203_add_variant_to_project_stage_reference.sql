-- Migration: Add variant to project_stage (reference table)
-- Описание: Добавление поля variant в справочник стадий проекта
-- Дата: 2026-XX-XX

DO $$
BEGIN
    -- Add variant column if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'project_stage' AND column_name = 'variant'
    ) THEN
        ALTER TABLE project_stage ADD COLUMN variant VARCHAR(20) DEFAULT 'solid';
    END IF;
END $$;

COMMENT ON COLUMN project_stage.variant IS 'Вариант отображения: solid | soft | outline | ghost';

-- Set default variant for existing stages
UPDATE project_stage SET variant = 'solid' WHERE variant IS NULL OR variant = '';
