INSERT INTO system_settings (setting_key, value) 
VALUES 
  ('ai.provider', '{"value": "mock"}'),
  ('ai.api_key', '{"value": ""}'),
  ('ai.model', '{"value": "gpt-4o-mini"}')
ON CONFLICT (setting_key) DO NOTHING;
