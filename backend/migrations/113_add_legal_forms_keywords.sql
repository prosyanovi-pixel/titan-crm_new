-- Migration: Добавление ключевых слов для правовых форм
-- Описание: Поле keywords позволит автоматически определять форму по наименованию организации
-- Дата: 2026-04-26

-- Переименовываем таблицу если она в единственном числе (для совместимости с кодом)
-- Но сначала проверим существование обеих
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'legal_form') AND NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'legal_forms') THEN
        ALTER TABLE legal_form RENAME TO legal_forms;
    END IF;
END $$;

-- Добавляем колонку keywords
ALTER TABLE legal_forms ADD COLUMN IF NOT EXISTS keywords text;
COMMENT ON COLUMN legal_forms.keywords IS 'Ключевые слова для автоподбора через запятую (напр. "общество с ограниченной ответственностью, ооо")';

-- Заполняем базовые значения для существующих форм
UPDATE legal_forms SET keywords = 'общество с ограниченной ответственностью, ооо' WHERE code = 'ooo';
UPDATE legal_forms SET keywords = 'индивидуальный предприниматель, ип' WHERE code = 'ip';
UPDATE legal_forms SET keywords = 'публичное акционерное общество, пао' WHERE code = 'pao';
UPDATE legal_forms SET keywords = 'акционерное общество, ао' WHERE code = 'ao';
UPDATE legal_forms SET keywords = 'самозанятый, самозанятая' WHERE code = 'self';
UPDATE legal_forms SET keywords = 'автономная некоммерческая организация, ано' WHERE code = 'ano';
