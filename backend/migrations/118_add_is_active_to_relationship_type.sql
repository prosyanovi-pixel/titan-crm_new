-- Migration: Добавление флага активности для типов отношений
-- Описание: Позволяет отключать типы без их удаления
-- Дата: 2026-04-26

ALTER TABLE relationship_type ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;
COMMENT ON COLUMN relationship_type.is_active IS 'Флаг активности типа отношений';

-- Обновляем существующие записи
UPDATE relationship_type SET is_active = true WHERE is_active IS NULL;
