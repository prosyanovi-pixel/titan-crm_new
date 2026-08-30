-- Migration 359: Seed complement (product/service справочники + налоговые ставки)
-- Заполняет справочники, которые не были засеяны ранними миграциями:
--   * product_status / service_status          (0 строк на чистой БД)
--   * product_categories / service_categories  (0 строк на чистой БД)
--   * finance_tax_rates                        (были только 2 исторические ставки НДС)
-- Все INSERT идемпотентны: ON CONFLICT / WHERE NOT EXISTS.

-- ============================================================
-- 1. product_status
-- ============================================================
INSERT INTO product_status (id, name, color, displayorder, variant, size, shape, icon, is_glass, is_gradient, secondary_color, is_animated)
VALUES ('in_stock', 'В наличии', '#22c55e', 0, 'solid', 'md', 'rounded', NULL, false, false, NULL, false)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 2. service_status
-- ============================================================
INSERT INTO service_status (id, name, color, displayorder, variant, size, shape, icon, is_glass, is_gradient, secondary_color, is_animated)
VALUES ('active', 'Активно', '#22c55e', 0, 'solid', 'md', 'rounded', NULL, false, false, NULL, false)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 3. product_categories
-- ============================================================
INSERT INTO product_categories (id, name, parent_id, description, images, translations)
VALUES
    (1, 'Оборудование', NULL, NULL, '[]'::jsonb, '{"en": {"name": "", "description": ""}}'::jsonb),
    (3, 'Станки фрезерные', 1, NULL, '[]'::jsonb, '{"en": {"name": "", "description": ""}}'::jsonb)
ON CONFLICT (id) DO NOTHING;

SELECT setval(pg_get_serial_sequence('product_categories', 'id'),
              GREATEST((SELECT COALESCE(MAX(id), 1) FROM product_categories), 1));

-- ============================================================
-- 4. service_categories
-- ============================================================
INSERT INTO service_categories (id, name, parent_id, description, images, translations)
VALUES (1, 'ПНР', NULL, NULL, '[]'::jsonb, '{}'::jsonb)
ON CONFLICT (id) DO NOTHING;

SELECT setval(pg_get_serial_sequence('service_categories', 'id'),
              GREATEST((SELECT COALESCE(MAX(id), 1) FROM service_categories), 1));

-- ============================================================
-- 5. finance_tax_regimes: недостающие режимы налогообложения
--    (на рабочей БД их 7; в миграциях есть только 4 базовых)
--    Колонки has_* есть не во всех схемах (локальная — 110-й версии),
--    поэтому используем только общие поля, а has_* донастраиваем
--    отдельным блоком с проверкой существования колонки.
-- ============================================================
INSERT INTO finance_tax_regimes (id, code, name, description, is_active,
                                 default_vat_rate, default_profit_tax_rate,
                                 default_usn_rate, default_insurance_rate, default_ndfl_rate)
VALUES
    (5, 'AUSN',    'Автоматизированная УСН (АУСН)',        'Налог для ИТ-компаний и малого бизнеса, расчёт автоматизирован', true, 0.00, 0.00, 8.00, 30.00, 0.00),
    (6, 'USN_NDV', 'УСН с НДС (при превышении 60 млн ₽)',  'УСН с обязанностью уплаты НДС при выручке свыше 60 млн ₽',        true, 0.00, 0.00, 6.00, 30.00, 0.00),
    (7, 'NPD',     'Налог на профессиональный доход (НПД)', 'НПД / Самозанятый',                                              true, 0.00, 0.00, 6.00, 0.00,  0.00)
ON CONFLICT (id) DO NOTHING;

-- Настройка has_*-флагов (только если колонки существуют — схема 70-й версии)
DO $$
DECLARE
    has_usn bool;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'finance_tax_regimes' AND column_name = 'has_usn_tax'
    ) INTO has_usn;

    IF has_usn THEN
        UPDATE finance_tax_regimes
           SET has_usn_tax = true, has_insurance = false, has_ndfl = true
         WHERE code IN ('AUSN', 'USN_NDV');

        UPDATE finance_tax_regimes
           SET has_usn_tax = false, has_insurance = false, has_ndfl = true
         WHERE code = 'NPD';

        UPDATE finance_tax_regimes
           SET has_vat = true, has_profit_tax = false, has_usn_tax = false,
               has_insurance = false, has_ndfl = false
         WHERE code = 'USN_NDV';
    END IF;
END $$;

-- ============================================================
-- 6. finance_tax_rates: активные ставки для всех режимов
--    (пропускаем комбинации, где активная ставка уже есть)
-- ============================================================
INSERT INTO finance_tax_rates (tax_regime_id, tax_type, name, rate, is_fixed, effective_from, effective_to, is_active)
SELECT v.tax_regime_id, v.tax_type, v.name, v.rate, false, v.effective_from, NULL, true
FROM (VALUES
    -- ОСН (1)
    (1, 'vat',        'НДС (20%)',              20.00, DATE '2025-01-01'),
    (1, 'vat',        'НДС (22% с 2026)',       22.00, DATE '2026-01-01'),
    (1, 'profit_tax', 'Налог на прибыль',       20.00, DATE '2025-01-01'),
    (1, 'insurance',  'Страховые взносы',       30.00, DATE '2025-01-01'),
    -- УСН 6% (2)
    (2, 'usn',        'УСН (6%)',                6.00, DATE '2025-01-01'),
    (2, 'insurance',  'Страховые взносы',       30.00, DATE '2025-01-01'),
    -- УСН 15% (3)
    (3, 'usn',        'УСН (15%)',              15.00, DATE '2025-01-01'),
    (3, 'insurance',  'Страховые взносы',       30.00, DATE '2025-01-01'),
    -- ЕСХН (4)
    (4, 'usn',        'ЕСХН (6%)',               6.00, DATE '2025-01-01'),
    (4, 'insurance',  'Страховые взносы',       30.00, DATE '2025-01-01'),
    -- АУСН (5)
    (5, 'usn',        'АУСН (8%)',               8.00, DATE '2025-01-01'),
    -- УСН с НДС (6)
    (6, 'usn',        'УСН (6%)',                6.00, DATE '2025-01-01'),
    (6, 'insurance',  'Страховые взносы',       30.00, DATE '2025-01-01')
) AS v(tax_regime_id, tax_type, name, rate, effective_from)
WHERE NOT EXISTS (
    SELECT 1 FROM finance_tax_rates f
    WHERE f.tax_regime_id = v.tax_regime_id
      AND f.tax_type = v.tax_type
      AND f.is_active = true
);

SELECT setval(pg_get_serial_sequence('finance_tax_rates', 'id'),
              GREATEST((SELECT COALESCE(MAX(id), 1) FROM finance_tax_rates), 1));