-- Migration: Фикс таблиц правовых форм и групп
-- Дата: 2026-04-26

-- 1. Добавляем недостающие колонки в legal_forms
ALTER TABLE legal_forms ADD COLUMN IF NOT EXISTS group_id character varying(50);
ALTER TABLE legal_forms ADD COLUMN IF NOT EXISTS show_as_tab boolean DEFAULT true;

-- 2. Переносим данные из старой таблицы если они там есть
UPDATE legal_forms lf
SET 
    group_id = old.group_id,
    show_as_tab = old.show_as_tab
FROM legal_form old
WHERE lf.code = old.id;

-- 3. Удаляем старую таблицу
DROP TABLE IF EXISTS legal_form;

-- 4. Убеждаемся что индексы и связи на месте
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_legal_forms_group') THEN
        ALTER TABLE legal_forms 
        ADD CONSTRAINT fk_legal_forms_group 
        FOREIGN KEY (group_id) REFERENCES legal_form_groups(id) ON DELETE SET NULL;
    END IF;
END $$;
