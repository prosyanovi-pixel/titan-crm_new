CREATE TABLE IF NOT EXISTS system_settings (
  setting_key VARCHAR(100) PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO system_settings (setting_key, value)
VALUES ('trash_auto_clean', '{"enabled": true, "retention_days": 30}')
ON CONFLICT (setting_key) DO NOTHING;
