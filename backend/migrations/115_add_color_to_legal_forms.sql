-- Migration: Добавление цвета для правовых форм
-- Описание: Позволяет задавать индивидуальный цвет для бейджей правовых форм
-- Дата: 2026-04-26

ALTER TABLE legal_forms ADD COLUMN IF NOT EXISTS color character varying(20) DEFAULT '#3B82F6';
COMMENT ON COLUMN legal_forms.color IS 'Цвет в формате HEX';

-- Устанавливаем дефолтное значение для существующих записей
UPDATE legal_forms SET color = '#3B82F6' WHERE color IS NULL;
