-- Migration 315: Register reports module and ensure report_configs table
-- Цель: Добавить модуль отчётов в таблицу modules для авто-регистрации роутов

-- 1. Создаём таблицу конфигураций отчётов (если ещё нет)
CREATE TABLE IF NOT EXISTS report_configs (
  id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  name        VARCHAR(255) NOT NULL,
  description TEXT,
  report_type VARCHAR(100) NOT NULL,
  filters     JSONB        NOT NULL DEFAULT '{}',
  columns     JSONB        NOT NULL DEFAULT '[]',
  chart_type  VARCHAR(50),
  is_shared   BOOLEAN      NOT NULL DEFAULT FALSE,
  created_by  VARCHAR(50)  REFERENCES users(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_report_configs_created_by ON report_configs(created_by);
CREATE INDEX IF NOT EXISTS idx_report_configs_type       ON report_configs(report_type);
CREATE INDEX IF NOT EXISTS idx_report_configs_shared     ON report_configs(is_shared) WHERE is_shared = TRUE;

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_report_configs_updated_at ON report_configs;
CREATE TRIGGER trg_report_configs_updated_at
  BEFORE UPDATE ON report_configs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 2. Регистрируем модуль отчётов (если ещё нет)
INSERT INTO modules (id, name, icon, folder, displayorder, is_active)
VALUES ('reports', 'Отчёты', 'BarChart2', 'reports', 95, true)
ON CONFLICT (id) DO UPDATE SET
    folder = EXCLUDED.folder,
    is_active = EXCLUDED.is_active,
    name = EXCLUDED.name;
