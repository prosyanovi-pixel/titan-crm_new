-- Migration 17: Create System Settings Table
-- Description: Create a table to store global system configuration

CREATE TABLE IF NOT EXISTS system_settings (
    setting_key VARCHAR(50) PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default empty structures
INSERT INTO system_settings (setting_key, value) VALUES
('email_config', '{"host": "", "port": "587", "secure": false, "user": "", "password": "", "from": "TITAN CRM <no-reply@titan.com>"}'),
('telegram_config', '{"botToken": "", "enabled": false}')
ON CONFLICT (setting_key) DO NOTHING;
