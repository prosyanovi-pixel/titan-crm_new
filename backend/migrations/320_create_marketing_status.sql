-- Migration 320: Create marketing_status table for Marketing module statuses
-- Adds a lightweight status table so Marketing module can manage its own statuses via Settings UI

CREATE TABLE IF NOT EXISTS marketing_status (
  id VARCHAR(100) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  displayorder INT DEFAULT 0,
  color VARCHAR(7),
  variant VARCHAR(20) DEFAULT 'solid',
  size VARCHAR(10) DEFAULT 'md',
  shape VARCHAR(20) DEFAULT 'rounded',
  icon VARCHAR(50),
  is_glass BOOLEAN DEFAULT FALSE,
  is_gradient BOOLEAN DEFAULT FALSE,
  secondary_color VARCHAR(7),
  is_animated BOOLEAN DEFAULT FALSE
);

-- Seed with sensible defaults for marketing campaigns
INSERT INTO marketing_status (id, name, displayorder, color, variant, shape)
VALUES
('draft', 'Черновик', 0, '#64748B', 'soft', 'pill'),
('active', 'Активна', 1, '#10B981', 'soft', 'pill'),
('paused', 'Пауза', 2, '#F59E0B', 'soft', 'pill'),
('completed', 'Завершена', 3, '#3B82F6', 'soft', 'pill'),
('cancelled', 'Отменена', 4, '#EF4444', 'soft', 'pill')
ON CONFLICT (id) DO NOTHING;
