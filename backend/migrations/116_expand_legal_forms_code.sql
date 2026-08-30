-- Migration: Расширение длины кода правовой формы
-- Описание: Увеличение лимита для code с 20 до 50 символов
-- Дата: 2026-04-26
-- ВАЖНО: на свежей БД таблица legal_forms (из миграций 09/113) имеет
-- колонку id, а не code — расширяем, только если code существует

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'legal_forms' AND column_name = 'code'
  ) THEN
    ALTER TABLE legal_forms ALTER COLUMN code TYPE character varying(50);
  END IF;
END $$;
