# Migration 25: Update Tags to CSS Variants

## Description
Update tag colors to use CSS variant names instead of hex colors and add variant column for future use.

## SQL Statements

```

UPDATE defined_tags SET color = 'vip' WHERE color = '#EF4444' AND name IN ('VIP', 'Важно', 'Срочно');
UPDATE defined_tags SET color = 'government' WHERE color = '#8B5CF6' AND name = 'Госсектор';
UPDATE defined_tags SET color = 'active' WHERE color = '#3B82F6' AND name = 'На проверке';
UPDATE defined_tags SET color = 'default' WHERE color IS NULL OR color = '#F3F4F6';

ALTER TABLE defined_tags ADD COLUMN IF NOT EXISTS variant VARCHAR(20);
UPDATE defined_tags SET variant = color WHERE color IN ('default', 'vip', 'active', 'pending', 'paused', 'done', 'production', 'government');
UPDATE defined_tags SET variant = 'default' WHERE variant IS NULL;

INSERT INTO system_settings (setting_key, value) VALUES 
('modules.legal_cases', '{"enabled": true, "displayorder": 5, "name": "Юридические дела", "icon": "scale"}'),
('modules.settings', '{"enabled": true, "displayorder": 9, "name": "Настройки", "icon": "settings"}'),
('modules.projects', '{"enabled": true, "displayorder": 2, "name": "Проекты", "icon": "folder"}'),
('modules.tasks', '{"enabled": true, "displayorder": 3, "name": "Задачи", "icon": "task"}'),
('modules.contractors', '{"enabled": true, "displayorder": 4, "name": "Контрагенты", "icon": "users"}'),
('modules.documents', '{"enabled": true, "displayorder": 7, "name": "Документы", "icon": "folder-open"}'),
('modules.calendar', '{"enabled": true, "displayorder": 8, "name": "Календарь", "icon": "calendar"}'),
('modules.dashboard', '{"enabled": true, "displayorder": 1, "name": "Дашборд", "icon": "layout-dashboard"}'),
('modules.mail', '{"enabled": true, "displayorder": 6, "name": "Почта", "icon": "mail"}')
ON CONFLICT (setting_key) DO NOTHING;
```