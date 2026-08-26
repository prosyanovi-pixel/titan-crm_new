-- Migration 110: Расширение таблиц налоговых режимов и ставок для требований 2026 года
-- Описание: Добавление полей для юридических форм, лимитов, дат актуальности и онлайн-касс
-- Дата: 2026-04-25
-- Зависимости: 70_finance_tax_settings.sql, 72_tax_rates_effective_dates.sql

-- ============================================================
-- ЧАСТЬ 1: Расширение finance_tax_regimes
-- ============================================================

-- Добавляем поле applies_to_legal_forms (text[]) для хранения массива кодов юридических форм
-- Если колонка уже существует как text[], оставляем как есть
ALTER TABLE finance_tax_regimes
ADD COLUMN IF NOT EXISTS applies_to_legal_forms text[] DEFAULT '{}';

-- Добавляем поле valid_from (дата начала действия режима)
ALTER TABLE finance_tax_regimes 
ADD COLUMN IF NOT EXISTS valid_from DATE DEFAULT CURRENT_DATE;

-- Добавляем поле valid_to (дата окончания действия режима)
ALTER TABLE finance_tax_regimes 
ADD COLUMN IF NOT EXISTS valid_to DATE DEFAULT NULL;

-- Добавляем поле requires_nds (требуется ли НДС) - дублирует has_vat, но для совместимости
ALTER TABLE finance_tax_regimes 
ADD COLUMN IF NOT EXISTS requires_nds BOOLEAN DEFAULT FALSE;

-- Добавляем поле max_income_limit (максимальный лимит дохода)
ALTER TABLE finance_tax_regimes 
ADD COLUMN IF NOT EXISTS max_income_limit DECIMAL(15,2) DEFAULT NULL;

-- Добавляем поле max_employees_limit (максимальный лимит сотрудников)
ALTER TABLE finance_tax_regimes 
ADD COLUMN IF NOT EXISTS max_employees_limit INTEGER DEFAULT NULL;

-- Добавляем поле requires_online_cashier (требуется ли онлайн-касса)
ALTER TABLE finance_tax_regimes 
ADD COLUMN IF NOT EXISTS requires_online_cashier BOOLEAN DEFAULT FALSE;

-- Комментарии к новым полям
COMMENT ON COLUMN finance_tax_regimes.applies_to_legal_forms IS 'Массив кодов юридических форм, для которых применим режим (["IP", "OOO", "AO"])';
COMMENT ON COLUMN finance_tax_regimes.valid_from IS 'Дата начала действия режима';
COMMENT ON COLUMN finance_tax_regimes.valid_to IS 'Дата окончания действия режима (NULL - бессрочно)';
COMMENT ON COLUMN finance_tax_regimes.requires_nds IS 'Требуется ли НДС (синоним has_vat)';
COMMENT ON COLUMN finance_tax_regimes.max_income_limit IS 'Максимальный лимит годового дохода для применения режима';
COMMENT ON COLUMN finance_tax_regimes.max_employees_limit IS 'Максимальный лимит численности сотрудников';
COMMENT ON COLUMN finance_tax_regimes.requires_online_cashier IS 'Требуется ли использование онлайн-кассы';

-- Обновляем requires_nds на основе has_vat
UPDATE finance_tax_regimes SET requires_nds = has_vat WHERE requires_nds IS NULL;

-- ============================================================
-- ЧАСТЬ 2: Расширение finance_tax_rates
-- ============================================================

-- Добавляем поле rate_value (числовое значение ставки, альтернатива rate)
ALTER TABLE finance_tax_rates 
ADD COLUMN IF NOT EXISTS rate_value DECIMAL(5,2) DEFAULT NULL;

-- Добавляем поле is_default (является ли ставкой по умолчанию для типа)
ALTER TABLE finance_tax_rates 
ADD COLUMN IF NOT EXISTS is_default BOOLEAN DEFAULT FALSE;

-- Добавляем поле legal_forms (text[]) для ограничения по юридическим формам
ALTER TABLE finance_tax_rates
ADD COLUMN IF NOT EXISTS legal_forms text[] DEFAULT '{}';

-- Добавляем поле applies_from (дата начала действия ставки, синоним effective_from)
ALTER TABLE finance_tax_rates 
ADD COLUMN IF NOT EXISTS applies_from DATE DEFAULT NULL;

-- Обновляем rate_value из rate, если rate_value NULL
UPDATE finance_tax_rates SET rate_value = rate WHERE rate_value IS NULL;

-- Обновляем applies_from из effective_from, если applies_from NULL
UPDATE finance_tax_rates SET applies_from = effective_from WHERE applies_from IS NULL AND effective_from IS NOT NULL;

-- Комментарии к новым полям
COMMENT ON COLUMN finance_tax_rates.rate_value IS 'Значение ставки (дублирует rate для совместимости)';
COMMENT ON COLUMN finance_tax_rates.is_default IS 'Является ли ставкой по умолчанию для данного типа налога в режиме';
COMMENT ON COLUMN finance_tax_rates.legal_forms IS 'Массив кодов юридических форм, для которых действует ставка (пусто = для всех)';
COMMENT ON COLUMN finance_tax_rates.applies_from IS 'Дата начала действия ставки (синоним effective_from)';

-- ============================================================
-- ЧАСТЬ 3: Создание индексов для улучшения производительности
-- ============================================================

-- Индекс для поиска режимов по юридической форме
CREATE INDEX IF NOT EXISTS idx_finance_tax_regimes_legal_forms 
ON finance_tax_regimes USING GIN (applies_to_legal_forms);

-- Индекс для фильтрации по датам актуальности
CREATE INDEX IF NOT EXISTS idx_finance_tax_regimes_valid_dates 
ON finance_tax_regimes (valid_from, valid_to) WHERE valid_to IS NOT NULL;

-- Индекс для поиска ставок по юридическим формам
CREATE INDEX IF NOT EXISTS idx_finance_tax_rates_legal_forms 
ON finance_tax_rates USING GIN (legal_forms);

-- ============================================================
-- ЧАСТЬ 4: Обновление существующих записей
-- ============================================================

-- Устанавливаем applies_to_legal_forms = ['IP','OOO','AO'] для всех активных режимов (временная мера)
UPDATE finance_tax_regimes
SET applies_to_legal_forms = ARRAY['IP','OOO','AO']
WHERE (applies_to_legal_forms = '{}' OR array_length(applies_to_legal_forms, 1) = 0) AND is_active = TRUE;

-- Устанавливаем valid_from = created_at для записей, где valid_from не установлена
UPDATE finance_tax_regimes 
SET valid_from = created_at 
WHERE valid_from IS NULL;

-- Устанавливаем is_default = TRUE для первой ставки каждого типа в каждом режиме
WITH ranked_rates AS (
  SELECT id,
         ROW_NUMBER() OVER (PARTITION BY tax_regime_id, tax_type ORDER BY id) as rn
  FROM finance_tax_rates
  WHERE is_active = TRUE
)
UPDATE finance_tax_rates 
SET is_default = TRUE 
FROM ranked_rates 
WHERE finance_tax_rates.id = ranked_rates.id AND ranked_rates.rn = 1;

-- ============================================================
-- ЧАСТЬ 5: Проверка целостности
-- ============================================================

-- Ограничение: valid_to должен быть >= valid_from
ALTER TABLE finance_tax_regimes 
ADD CONSTRAINT chk_finance_tax_regimes_valid_dates 
CHECK (valid_to IS NULL OR valid_to >= valid_from);

-- Ограничение: max_income_limit >= 0
ALTER TABLE finance_tax_regimes 
ADD CONSTRAINT chk_finance_tax_regimes_max_income_limit 
CHECK (max_income_limit IS NULL OR max_income_limit >= 0);

-- Ограничение: max_employees_limit >= 0
ALTER TABLE finance_tax_regimes 
ADD CONSTRAINT chk_finance_tax_regimes_max_employees_limit 
CHECK (max_employees_limit IS NULL OR max_employees_limit >= 0);

-- Ограничение: rate_value >= 0
ALTER TABLE finance_tax_rates 
ADD CONSTRAINT chk_finance_tax_rates_rate_value 
CHECK (rate_value IS NULL OR rate_value >= 0);

-- Сообщение о завершении миграции
DO $$
BEGIN
  RAISE NOTICE 'Миграция 110 успешно применена. Таблицы налоговых режимов расширены для требований 2026 года.';
END $$;