-- Миграция: расширение данных контрагентов для физлиц, иностранных компаний и ЮЛ (РФ)
-- Исправлено имя таблицы банковских счетов: contractor_bank_accounts

BEGIN;

-- 1. Расширение таблицы контрагентов
ALTER TABLE contractors
  ADD COLUMN IF NOT EXISTS gender VARCHAR(10), -- male, female
  ADD COLUMN IF NOT EXISTS passport_series VARCHAR(10),
  ADD COLUMN IF NOT EXISTS passport_number VARCHAR(20),
  ADD COLUMN IF NOT EXISTS passport_issued_by TEXT,
  ADD COLUMN IF NOT EXISTS passport_issued_date DATE,
  ADD COLUMN IF NOT EXISTS passport_unit_code VARCHAR(10),
  ADD COLUMN IF NOT EXISTS registration_address TEXT,
  ADD COLUMN IF NOT EXISTS okato VARCHAR(20),
  ADD COLUMN IF NOT EXISTS okpo VARCHAR(20);

-- 2. Расширение таблицы банковских счетов (правильное имя таблицы)
-- Проверяем существование таблицы перед изменением
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename  = 'contractor_bank_accounts') THEN
        ALTER TABLE contractor_bank_accounts ADD COLUMN IF NOT EXISTS swift VARCHAR(20);
    END IF;
END $$;

COMMIT;
