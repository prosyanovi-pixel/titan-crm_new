-- Migration 362: Add tax regime to company profile
-- Добавляет связь компании с режимом налогообложения

ALTER TABLE company_profile 
ADD COLUMN IF NOT EXISTS tax_regime_id INTEGER REFERENCES finance_tax_regimes(id) ON DELETE SET NULL;
