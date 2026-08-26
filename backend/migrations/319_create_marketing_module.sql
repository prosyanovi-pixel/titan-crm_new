-- Migration 319: Register marketing module and create marketing_campaigns table
-- Цель: Добавить модуль маркетинга и таблицу для кампаний

CREATE TABLE IF NOT EXISTS marketing_campaigns (
  id             UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
  name           VARCHAR(255)   NOT NULL,
  description    TEXT,
  status         VARCHAR(50)    NOT NULL DEFAULT 'draft',
  type           VARCHAR(50)    NOT NULL,
  budget         DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
  actual_cost    DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
  start_date     DATE,
  end_date       DATE,
  target_audience TEXT,
  created_by     VARCHAR(50)    REFERENCES users(id) ON DELETE SET NULL,
  created_at     TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_marketing_campaigns_created_by ON marketing_campaigns(created_by);
CREATE INDEX IF NOT EXISTS idx_marketing_campaigns_status ON marketing_campaigns(status);

-- Функция обновления updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_marketing_campaigns_updated_at ON marketing_campaigns;
CREATE TRIGGER trg_marketing_campaigns_updated_at
  BEFORE UPDATE ON marketing_campaigns
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Регистрируем модуль в таблице modules
INSERT INTO modules (id, name, icon, folder, displayorder, is_active)
VALUES ('marketing', 'Маркетинг', 'Megaphone', 'marketing', 96, true)
ON CONFLICT (id) DO UPDATE SET
    folder = EXCLUDED.folder,
    is_active = EXCLUDED.is_active,
    name = EXCLUDED.name,
    icon = EXCLUDED.icon;

-- Вставляем права доступа
INSERT INTO permissions (id, name, category, description) VALUES
  ('marketing.read', 'marketing.read', 'marketing', 'Просмотр маркетинга'),
  ('marketing.write', 'marketing.write', 'marketing', 'Редактирование маркетинга'),
  ('marketing.delete', 'marketing.delete', 'marketing', 'Удаление маркетинга')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  description = EXCLUDED.description;

-- Добавляем права ролям
UPDATE roles 
SET permissions = (
  CASE 
    WHEN NOT (permissions ? 'marketing.*') THEN permissions || '["marketing.*"]'::jsonb
    ELSE permissions
  END
)
WHERE id = 'manager';

UPDATE roles 
SET permissions = (
  CASE 
    WHEN NOT (permissions ? 'marketing.read') THEN permissions || '["marketing.read"]'::jsonb
    ELSE permissions
  END
)
WHERE id = 'accountant';
