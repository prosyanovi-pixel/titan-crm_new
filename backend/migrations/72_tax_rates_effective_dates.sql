-- Migration 72: Tax Rates Effective Dates
-- Описание: Добавление дат вступления в силу для налоговых ставок
-- Дата: 2026-03-30
-- Зависимости: 70_finance_tax_settings.sql

-- ============================================================
-- ЧАСТЬ 1: Добавляем поля effective_from/effective_to
-- ============================================================

-- Поля уже есть в таблице finance_tax_rates из миграции 70
-- Проверяем и обновляем существующие записи

-- Устанавливаем даты по умолчанию для существующих ставок
UPDATE finance_tax_rates 
SET 
  effective_from = COALESCE(effective_from, '2025-01-01'),
  effective_to = NULL,
  updated_at = CURRENT_TIMESTAMP
WHERE effective_from IS NULL;

-- ============================================================
-- ЧАСТЬ 2: Создаём представление для актуальных ставок
-- ============================================================

CREATE OR REPLACE VIEW v_current_tax_rates AS
SELECT 
  tr.id as regime_id,
  tr.code as regime_code,
  tr.name as regime_name,
  r.tax_type,
  r.name as rate_name,
  r.rate,
  r.is_fixed,
  r.fixed_amount,
  r.effective_from,
  r.effective_to
FROM finance_tax_rates r
JOIN finance_tax_regimes tr ON r.tax_regime_id = tr.id
WHERE r.is_active = TRUE
  AND (r.effective_from IS NULL OR r.effective_from <= CURRENT_DATE)
  AND (r.effective_to IS NULL OR r.effective_to >= CURRENT_DATE)
ORDER BY tr.code, r.tax_type, r.effective_from DESC;

-- ============================================================
-- ЧАСТЬ 3: Функция для получения ставки на дату
-- ============================================================

CREATE OR REPLACE FUNCTION get_tax_rate_on_date(
  p_tax_regime_id INTEGER,
  p_tax_type VARCHAR(50),
  p_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
  rate DECIMAL(5,2),
  is_fixed BOOLEAN,
  fixed_amount DECIMAL(15,2),
  effective_from DATE,
  effective_to DATE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    r.rate,
    r.is_fixed,
    r.fixed_amount,
    r.effective_from,
    r.effective_to
  FROM finance_tax_rates r
  WHERE r.tax_regime_id = p_tax_regime_id
    AND r.tax_type = p_tax_type
    AND r.is_active = TRUE
    AND (r.effective_from IS NULL OR r.effective_from <= p_date)
    AND (r.effective_to IS NULL OR r.effective_to >= p_date)
  ORDER BY r.effective_from DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- ЧАСТЬ 4: Примеры исторических ставок НДС
-- ============================================================

-- НДС 20% действовал до 2024 года
-- НДС 22% действует с 2025 года

-- Обновляем существующую ставку НДС 22% (с 2025 года)
UPDATE finance_tax_rates 
SET 
  effective_from = '2025-01-01',
  effective_to = NULL
WHERE tax_type = 'vat' 
  AND rate = 20.00
  AND tax_regime_id IN (SELECT id FROM finance_tax_regimes WHERE code = 'OSN');

-- Добавляем историческую ставку НДС 18% (до 2018 года)
INSERT INTO finance_tax_rates (tax_regime_id, tax_type, name, rate, is_fixed, effective_from, effective_to, is_active)
SELECT id, 'vat', 'НДС (18% исторический)', 18.00, false, '2000-01-01', '2018-12-31', false
FROM finance_tax_regimes WHERE code = 'OSN'
ON CONFLICT DO NOTHING;

-- Добавляем НДС 20% (2019-2024)
INSERT INTO finance_tax_rates (tax_regime_id, tax_type, name, rate, is_fixed, effective_from, effective_to, is_active)
SELECT id, 'vat', 'НДС (20%)', 20.00, false, '2019-01-01', '2024-12-31', false
FROM finance_tax_regimes WHERE code = 'OSN'
ON CONFLICT DO NOTHING;

-- ============================================================
-- ЗАВЕРШЕНИЕ
-- ============================================================

-- Запись о миграции
INSERT INTO schema_migrations (filename, applied_at)
VALUES ('72_tax_rates_effective_dates', CURRENT_TIMESTAMP)
ON CONFLICT (filename) DO NOTHING;

-- Вывод сообщения об успехе
DO $$
BEGIN
  RAISE NOTICE 'Migration 72: Tax Rates Effective Dates completed successfully';
  RAISE NOTICE '  - Fields effective_from/effective_to: updated';
  RAISE NOTICE '  - View v_current_tax_rates: created';
  RAISE NOTICE '  - Function get_tax_rate_on_date(): created';
  RAISE NOTICE '  - Historical VAT rates: added';
END $$;
