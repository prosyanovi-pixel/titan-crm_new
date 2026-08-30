-- Migration 111: Создание таблицы истории изменений налоговых режимов контрагентов
-- Описание: Хранение истории смены налоговых режимов для аудита и анализа
-- Дата: 2026-04-25
-- Зависимости: 110_tax_regimes_2026_extensions.sql

-- ============================================================
-- ЧАСТЬ 1: Создание таблицы contractor_tax_history
-- ============================================================

CREATE TABLE IF NOT EXISTS contractor_tax_history (
  id SERIAL PRIMARY KEY,
  contractor_id INTEGER NOT NULL REFERENCES contractors(id) ON DELETE CASCADE,
  tax_regime_id INTEGER NOT NULL REFERENCES finance_tax_regimes(id) ON DELETE RESTRICT,
  previous_tax_regime_id INTEGER REFERENCES finance_tax_regimes(id) ON DELETE SET NULL,
  change_date DATE NOT NULL DEFAULT CURRENT_DATE,
  effective_date DATE NOT NULL DEFAULT CURRENT_DATE,
  change_reason TEXT,
  change_type VARCHAR(50) NOT NULL CHECK (change_type IN ('manual', 'automatic', 'system', 'optimization')),
  changed_by_user_id INTEGER,
  metadata JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Комментарии к таблице и колонкам
COMMENT ON TABLE contractor_tax_history IS 'История изменений налоговых режимов контрагентов';
COMMENT ON COLUMN contractor_tax_history.contractor_id IS 'ID контрагента';
COMMENT ON COLUMN contractor_tax_history.tax_regime_id IS 'ID нового налогового режима';
COMMENT ON COLUMN contractor_tax_history.previous_tax_regime_id IS 'ID предыдущего налогового режима (если был)';
COMMENT ON COLUMN contractor_tax_history.change_date IS 'Дата изменения записи';
COMMENT ON COLUMN contractor_tax_history.effective_date IS 'Дата вступления изменения в силу';
COMMENT ON COLUMN contractor_tax_history.change_reason IS 'Причина изменения (ручной ввод)';
COMMENT ON COLUMN contractor_tax_history.change_type IS 'Тип изменения: manual (ручное), automatic (автоматическое), system (системное), optimization (оптимизация)';
COMMENT ON COLUMN contractor_tax_history.changed_by_user_id IS 'ID пользователя, выполнившего изменение';
COMMENT ON COLUMN contractor_tax_history.metadata IS 'Дополнительные метаданные (расчеты, проверки, комментарии)';

-- ============================================================
-- ЧАСТЬ 2: Индексы для улучшения производительности
-- ============================================================

-- Индекс для поиска по контрагенту
CREATE INDEX IF NOT EXISTS idx_contractor_tax_history_contractor_id 
ON contractor_tax_history(contractor_id);

-- Индекс для поиска по дате изменения
CREATE INDEX IF NOT EXISTS idx_contractor_tax_history_change_date 
ON contractor_tax_history(change_date DESC);

-- Индекс для поиска по налоговому режиму
CREATE INDEX IF NOT EXISTS idx_contractor_tax_history_tax_regime_id 
ON contractor_tax_history(tax_regime_id);

-- Индекс для комбинированного поиска (контрагент + дата)
CREATE INDEX IF NOT EXISTS idx_contractor_tax_history_contractor_date 
ON contractor_tax_history(contractor_id, change_date DESC);

-- ============================================================
-- ЧАСТЬ 3: Триггер для автоматического обновления updated_at
-- ============================================================

CREATE OR REPLACE FUNCTION update_contractor_tax_history_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_contractor_tax_history_updated_at ON contractor_tax_history;
CREATE TRIGGER trigger_update_contractor_tax_history_updated_at
BEFORE UPDATE ON contractor_tax_history
FOR EACH ROW
EXECUTE FUNCTION update_contractor_tax_history_updated_at();

-- ============================================================
-- ЧАСТЬ 4: Заполнение начальными данными (опционально)
-- ============================================================

-- Переносим существующие назначения налоговых режимов из contractors.tax_regime_id
-- в историю как первоначальные записи
INSERT INTO contractor_tax_history (contractor_id, tax_regime_id, change_date, effective_date, change_type, change_reason)
SELECT 
  c.id,
  c.tax_regime_id,
  CURRENT_DATE,
  CURRENT_DATE,
  'system',
  'Первоначальное назначение налогового режима'
FROM contractors c
WHERE c.tax_regime_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM contractor_tax_history h 
    WHERE h.contractor_id = c.id AND h.tax_regime_id = c.tax_regime_id
  );

-- ============================================================
-- ЧАСТЬ 5: Сообщение о завершении миграции
-- ============================================================

DO $$
BEGIN
  RAISE NOTICE 'Миграция 111 успешно применена. Таблица contractor_tax_history создана.';
END $$;