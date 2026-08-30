-- Migration 358: Case record updates + Judge extra fields
-- Источник: JS-миграции add-case-record-updates.js, fix-case-updates-lawyer-id-type.js,
--           fix-case-updates-viewed-by-type.js, add-judge-extra-fields.js
-- Эти JS-файлы никогда не выполнялись migrate.js (поддерживаются только .sql/.md),
-- поэтому таблица case_record_updates и доп. поля judges отсутствовали на свежих БД,
-- хотя backend (modules/legal_cases) на них рассчитывает.

-- ============================================================
-- 1. Таблица case_record_updates (журнал обновлений дел)
-- lawyer_id / viewed_by сразу VARCHAR(255) (как после фикс-миграций JS)
-- ============================================================

CREATE TABLE IF NOT EXISTS case_record_updates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id VARCHAR(255) NOT NULL,
    lawyer_id VARCHAR(255),
    update_type VARCHAR(50) DEFAULT 'case_update', -- 'case_update', 'case_note', 'document_added'
    title VARCHAR(255),
    description TEXT,
    is_viewed BOOLEAN DEFAULT false,
    viewed_at TIMESTAMP,
    viewed_by VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (case_id) REFERENCES legal_cases(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_case_record_updates_case_id
    ON case_record_updates(case_id);

CREATE INDEX IF NOT EXISTS idx_case_record_updates_is_viewed
    ON case_record_updates(is_viewed);

-- ============================================================
-- 2. Доп. поля judges (секретарь, помощник, e-mail, кабинет, состав)
-- ============================================================

ALTER TABLE judges ADD COLUMN IF NOT EXISTS secretary_phone VARCHAR(50);
ALTER TABLE judges ADD COLUMN IF NOT EXISTS assistant_phone VARCHAR(50);
ALTER TABLE judges ADD COLUMN IF NOT EXISTS email VARCHAR(255);
ALTER TABLE judges ADD COLUMN IF NOT EXISTS office VARCHAR(20);
ALTER TABLE judges ADD COLUMN IF NOT EXISTS composition VARCHAR(100);