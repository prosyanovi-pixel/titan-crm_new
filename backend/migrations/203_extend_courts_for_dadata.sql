-- ============================================
-- Migration 203: Extend courts table for DaData integration
-- ============================================

-- 1. Добавляем поля из DaData справочника судов
ALTER TABLE courts ADD COLUMN IF NOT EXISTS dadata_code   VARCHAR(20);   -- Уникальный код суда в DaData
ALTER TABLE courts ADD COLUMN IF NOT EXISTS court_type    VARCHAR(5);    -- AS, RS, MS, OS и т.д.
ALTER TABLE courts ADD COLUMN IF NOT EXISTS court_type_name VARCHAR(200); -- "Арбитражный суд области"
ALTER TABLE courts ADD COLUMN IF NOT EXISTS inn           VARCHAR(12);
ALTER TABLE courts ADD COLUMN IF NOT EXISTS website       VARCHAR(500);
ALTER TABLE courts ADD COLUMN IF NOT EXISTS legal_address TEXT;

-- 2. Индекс на dadata_code для быстрого поиска дубликатов при upsert
CREATE UNIQUE INDEX IF NOT EXISTS idx_courts_dadata_code
  ON courts(dadata_code)
  WHERE dadata_code IS NOT NULL;
