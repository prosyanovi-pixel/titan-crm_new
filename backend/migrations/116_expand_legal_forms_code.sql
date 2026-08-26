-- Migration: Расширение длины кода правовой формы
-- Описание: Увеличение лимита для code с 20 до 50 символов
-- Дата: 2026-04-26

ALTER TABLE legal_forms ALTER COLUMN code TYPE character varying(50);
