-- Migration: Добавление прямой привязки контрагента к группе (вкладке)
-- Описание: Позволяет явно указывать вкладку, в которой отображается контрагент
-- Дата: 2026-04-26

ALTER TABLE contractors ADD COLUMN IF NOT EXISTS group_id character varying(50);

-- Устанавливаем внешнюю связь на справочник групп
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_contractors_group') THEN
        ALTER TABLE contractors 
        ADD CONSTRAINT fk_contractors_group 
        FOREIGN KEY (group_id) REFERENCES legal_form_groups(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Проставляем начальные значения на основе текущих правовых форм
UPDATE contractors c
SET group_id = lf.group_id
FROM legal_forms lf
WHERE c.legal_form = lf.code AND c.group_id IS NULL;
