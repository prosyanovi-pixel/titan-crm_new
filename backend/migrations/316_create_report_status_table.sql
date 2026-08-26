-- Migration 316: Create report_status table for Reports module statuses
-- Adds a lightweight status table so Reports module can manage its own statuses via Settings UI

CREATE TABLE IF NOT EXISTS report_status (
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

-- Seed with a couple of sensible defaults
INSERT INTO report_status (id, name, displayorder, color)
VALUES
('draft', 'Черновик', 0, '#6B7280'),
('published', 'Опубликован', 1, '#10B981'),
('archived', 'Архив', 2, '#9CA3AF')
ON CONFLICT (id) DO NOTHING;
