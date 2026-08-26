-- Миграция 106: Синхронизация списка модулей в таблице modules (исправленная версия)
-- Цель: Обеспечить наличие всех модулей для автоматической регистрации в backend/index.js

-- Сценарий: Вставка или обновление всех существующих модулей
INSERT INTO modules (id, name, icon, folder, displayorder, is_active) VALUES
('contractors', 'Контрагенты', 'Users', 'contractors', 10, true),
('projects', 'Проекты', 'FolderKanban', 'projects', 20, true),
('tasks', 'Задачи', 'CheckSquare', 'tasks', 30, true),
('documents', 'Документы', 'FileText', 'documents', 40, true),
('mail', 'Почта', 'Mail', 'mail', 50, true),
('lawyers', 'Юристы', 'Scale', 'lawyers', 60, true),
('cases', 'Дела', 'Gavel', 'legal_cases', 70, true),
('finance', 'Финансы', 'Wallet', 'finance', 80, true),
('calendar', 'Календарь', 'Calendar', 'calendar', 90, true),
('dashboard', 'Дашборд', 'LayoutDashboard', 'dashboard', 100, true),
('workflows', 'Автоматизация', 'Network', 'workflow', 110, true), -- Используем workflows для совпадения с имеющейся записью
('registry', 'Реестры', 'Table', 'registry', 120, true),
('enrichment', 'Обогащение данных', 'Database', 'enrichment', 130, true),
('profile', 'Профиль', 'User', 'profile', 140, true),
('settings', 'Настройки', 'Settings', 'settings', 150, true)
ON CONFLICT (id) DO UPDATE SET 
    folder = EXCLUDED.folder,
    is_active = EXCLUDED.is_active,
    name = EXCLUDED.name;

-- Обновление настроек префикса для модулей, где он отличается от стандартного /api/id
INSERT INTO module_settings (module_id, setting_key, value) VALUES
('cases', 'prefix', '"/api/legal-cases"'),
('workflows', 'prefix', '"/api/workflows"')
ON CONFLICT (module_id, setting_key) DO UPDATE SET value = EXCLUDED.value;
