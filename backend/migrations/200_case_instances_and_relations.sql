-- ============================================
-- Migration 200: Case Instances and Relations (I, Appeal, Cassation)
-- ============================================

-- 1. Создаем таблицу инстанций дела
CREATE TABLE IF NOT EXISTS case_instances (
    id VARCHAR(50) PRIMARY KEY,
    case_id VARCHAR(50) NOT NULL,
    instance_type VARCHAR(20) NOT NULL, -- 'first', 'appeal', 'cassation', 'supervision'
    instance_number VARCHAR(100) NOT NULL, -- Номер дела конкретной инстанции (А..., 13АП-..., Ф...)
    court_name VARCHAR(255),
    judge VARCHAR(255),
    status VARCHAR(50), -- Внутренний статус инстанции (Слушания, Решение и т.д.)
    is_active BOOLEAN DEFAULT false,
    creation_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (case_id) REFERENCES legal_cases(id) ON DELETE CASCADE
);

-- 2. Добавляем связи в существующие таблицы для фильтрации по инстанциям
ALTER TABLE case_documents ADD COLUMN IF NOT EXISTS instance_id VARCHAR(50),
ADD CONSTRAINT fk_case_documents_instance FOREIGN KEY (instance_id) REFERENCES case_instances(id) ON DELETE SET NULL;

ALTER TABLE case_events ADD COLUMN IF NOT EXISTS instance_id VARCHAR(50),
ADD CONSTRAINT fk_case_events_instance FOREIGN KEY (instance_id) REFERENCES case_instances(id) ON DELETE SET NULL;

ALTER TABLE case_notes ADD COLUMN IF NOT EXISTS instance_id VARCHAR(50),
ADD CONSTRAINT fk_case_notes_instance FOREIGN KEY (instance_id) REFERENCES case_instances(id) ON DELETE SET NULL;

-- 3. Индексы для быстрой выборки по инстанции
CREATE INDEX IF NOT EXISTS idx_case_instances_case_id ON case_instances(case_id);
CREATE INDEX IF NOT EXISTS idx_case_documents_instance_id ON case_documents(instance_id);
CREATE INDEX IF NOT EXISTS idx_case_events_instance_id ON case_events(instance_id);
CREATE INDEX IF NOT EXISTS idx_case_notes_instance_id ON case_notes(instance_id);

-- 4. Перенос существующих данных (Опционально: создаем запись о 'Первой инстанции' для существующих дел)
-- Вставьте этот блок, если хотите автоматически создать инстанции для старых дел
-- INSERT INTO case_instances (id, case_id, instance_type, instance_number, court_name, judge, status, is_active)
-- SELECT id || '_first', id, 'first', "caseNumber", "courtName", "judge", status, true 
-- FROM legal_cases;
