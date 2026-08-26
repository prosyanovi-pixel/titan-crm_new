-- Migration 321: Create marketing_type table for Marketing module types
-- Adds a lightweight type table so Marketing module can manage its own types via Settings UI

CREATE TABLE IF NOT EXISTS marketing_type (
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

-- Seed with sensible defaults for marketing campaign types
INSERT INTO marketing_type (id, name, displayorder, color, variant, shape)
VALUES
('email', 'Email', 0, '#3B82F6', 'soft', 'pill'),
('social', 'Социальные сети', 1, '#1F2937', 'soft', 'pill'),
('event', 'Событие', 2, '#8B5CF6', 'soft', 'pill'),
('direct_mail', 'Прямая почта', 3, '#059669', 'soft', 'pill'),
('other', 'Прочее', 4, '#6B7280', 'soft', 'pill')
ON CONFLICT (id) DO NOTHING;
