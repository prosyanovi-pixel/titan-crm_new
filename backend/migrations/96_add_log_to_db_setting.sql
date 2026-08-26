-- Migration 96: Add log_to_db setting
-- Description: Toggle for writing logs to database (system_logs table)
-- Default: false (logs go to files only)

INSERT INTO system_settings (setting_key, value) VALUES
('log_to_db', 'false')
ON CONFLICT (setting_key) DO NOTHING;
