-- Migration 201: Add color to project_stages
-- Описание: Добавление поля color в таблицу project_stages для визуализации в Ганте
-- Дата: 2026-04-29

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'project_stages' AND column_name = 'color') THEN
        ALTER TABLE project_stages ADD COLUMN color VARCHAR(50);
    END IF;
END $$;

COMMENT ON COLUMN project_stages.color IS 'CSS класс цвета или HEX код для визуализации этапа';
