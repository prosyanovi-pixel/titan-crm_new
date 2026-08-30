-- Migration 68: Create module_settings table
-- Purpose: Хранение настроек модулей включая настройки массового редактирования
-- Date: 2026-03-23

CREATE TABLE IF NOT EXISTS module_settings (
    id SERIAL PRIMARY KEY,
    module_id VARCHAR(100) NOT NULL,
    setting_key VARCHAR(200) NOT NULL,
    value JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(module_id, setting_key)
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_module_settings_module_id ON module_settings(module_id);
CREATE INDEX IF NOT EXISTS idx_module_settings_key ON module_settings(setting_key);
CREATE INDEX IF NOT EXISTS idx_module_settings_module_key ON module_settings(module_id, setting_key);

-- Comments
COMMENT ON TABLE module_settings IS 'Настройки модулей системы';
COMMENT ON COLUMN module_settings.module_id IS 'ID модуля (contractors, projects, tasks, etc.)';
COMMENT ON COLUMN module_settings.setting_key IS 'Ключ настройки (bulk_edit_fields, display, etc.)';
COMMENT ON COLUMN module_settings.value IS 'Значение настройки в формате JSON';

-- Insert default bulk edit settings for contractors
-- ВАЖНО: гарантируем наличие модулей calendar/finance (seed'атся позже, в 106),
-- иначе INSERT в module_settings упадёт по внешнему ключу на свежей БД.
INSERT INTO modules (id, name, icon, folder, displayorder) VALUES
('calendar', 'Календарь', 'Calendar', 'calendar', 90),
('finance', 'Финансы', 'Wallet', 'finance', 80)
ON CONFLICT (id) DO NOTHING;

INSERT INTO module_settings (module_id, setting_key, value) VALUES
('contractors', 'bulk_edit_fields', '{
    "fields": [
        {
            "id": "status",
            "label": "Статус",
            "type": "select",
            "dataSource": "statuses",
            "dataSourceModule": "contractors",
            "order": 1,
            "enabled": true
        },
        {
            "id": "type",
            "label": "Тип отношения",
            "type": "select",
            "dataSource": "relationshipTypes",
            "dataSourceModule": "contractors",
            "order": 2,
            "enabled": true
        },
        {
            "id": "legalForm",
            "label": "Правовая форма",
            "type": "select",
            "dataSource": "legalForms",
            "order": 3,
            "enabled": true
        },
        {
            "id": "manager",
            "label": "Менеджер",
            "type": "combobox",
            "dataSource": "users",
            "order": 4,
            "enabled": true
        },
        {
            "id": "tags",
            "label": "Теги",
            "type": "tags",
            "dataSource": "tags",
            "order": 5,
            "enabled": true
        }
    ],
    "enabled": true
}'::jsonb)
ON CONFLICT (module_id, setting_key) DO NOTHING;

-- Insert default bulk edit settings for projects
INSERT INTO module_settings (module_id, setting_key, value) VALUES
('projects', 'bulk_edit_fields', '{
    "fields": [
        {
            "id": "status",
            "label": "Статус",
            "type": "select",
            "dataSource": "statuses",
            "dataSourceModule": "projects",
            "order": 1,
            "enabled": true
        },
        {
            "id": "priority",
            "label": "Приоритет",
            "type": "select",
            "dataSource": "priorities",
            "dataSourceModule": "projects",
            "order": 2,
            "enabled": true
        },
        {
            "id": "manager",
            "label": "Менеджер",
            "type": "combobox",
            "dataSource": "users",
            "order": 3,
            "enabled": true
        }
    ],
    "enabled": true
}'::jsonb)
ON CONFLICT (module_id, setting_key) DO NOTHING;

-- Insert default bulk edit settings for cases (lawyers)
INSERT INTO module_settings (module_id, setting_key, value) VALUES
('cases', 'bulk_edit_fields', '{
    "fields": [
        {
            "id": "status",
            "label": "Статус",
            "type": "select",
            "dataSource": "statuses",
            "dataSourceModule": "cases",
            "order": 1,
            "enabled": true
        },
        {
            "id": "lawyerId",
            "label": "Юрист",
            "type": "combobox",
            "dataSource": "users",
            "order": 2,
            "enabled": true
        },
        {
            "id": "client",
            "label": "Клиент",
            "type": "combobox",
            "dataSource": "contractors",
            "order": 3,
            "enabled": true
        },
        {
            "id": "outcome",
            "label": "Результат",
            "type": "select",
            "dataSource": "outcomes",
            "order": 4,
            "enabled": true
        }
    ],
    "enabled": true
}'::jsonb)
ON CONFLICT (module_id, setting_key) DO NOTHING;

-- Insert default bulk edit settings for tasks
INSERT INTO module_settings (module_id, setting_key, value) VALUES
('tasks', 'bulk_edit_fields', '{
    "fields": [
        {
            "id": "status",
            "label": "Статус",
            "type": "select",
            "dataSource": "statuses",
            "dataSourceModule": "tasks",
            "order": 1,
            "enabled": true
        },
        {
            "id": "priority",
            "label": "Приоритет",
            "type": "select",
            "dataSource": "priorities",
            "dataSourceModule": "tasks",
            "order": 2,
            "enabled": true
        },
        {
            "id": "manager",
            "label": "Исполнитель",
            "type": "combobox",
            "dataSource": "users",
            "order": 3,
            "enabled": true
        },
        {
            "id": "folderId",
            "label": "Папка",
            "type": "select",
            "dataSource": "folders",
            "order": 4,
            "enabled": true
        },
        {
            "id": "tags",
            "label": "Теги",
            "type": "tags",
            "dataSource": "tags",
            "order": 5,
            "enabled": true
        }
    ],
    "enabled": true
}'::jsonb)
ON CONFLICT (module_id, setting_key) DO NOTHING;

-- Insert default bulk edit settings for documents
INSERT INTO module_settings (module_id, setting_key, value) VALUES
('documents', 'bulk_edit_fields', '{
    "fields": [
        {
            "id": "folderId",
            "label": "Папка",
            "type": "select",
            "dataSource": "folders",
            "order": 1,
            "enabled": true
        },
        {
            "id": "status",
            "label": "Статус",
            "type": "select",
            "dataSource": "statuses",
            "dataSourceModule": "documents",
            "order": 2,
            "enabled": true
        },
        {
            "id": "tags",
            "label": "Теги",
            "type": "tags",
            "dataSource": "tags",
            "order": 3,
            "enabled": true
        }
    ],
    "enabled": true
}'::jsonb)
ON CONFLICT (module_id, setting_key) DO NOTHING;

-- Insert default bulk edit settings for mail
INSERT INTO module_settings (module_id, setting_key, value) VALUES
('mail', 'bulk_edit_fields', '{
    "fields": [
        {
            "id": "folderId",
            "label": "Папка",
            "type": "select",
            "dataSource": "folders",
            "order": 1,
            "enabled": true
        },
        {
            "id": "status",
            "label": "Статус",
            "type": "select",
            "dataSource": "statuses",
            "dataSourceModule": "mail",
            "order": 2,
            "enabled": true
        },
        {
            "id": "tags",
            "label": "Теги",
            "type": "tags",
            "dataSource": "tags",
            "order": 3,
            "enabled": true
        }
    ],
    "enabled": true
}'::jsonb)
ON CONFLICT (module_id, setting_key) DO NOTHING;

-- Insert default bulk edit settings for lawyers
INSERT INTO module_settings (module_id, setting_key, value) VALUES
('lawyers', 'bulk_edit_fields', '{
    "fields": [
        {
            "id": "status",
            "label": "Статус",
            "type": "select",
            "dataSource": "statuses",
            "dataSourceModule": "lawyers",
            "order": 1,
            "enabled": true
        },
        {
            "id": "priority",
            "label": "Приоритет",
            "type": "select",
            "dataSource": "priorities",
            "dataSourceModule": "lawyers",
            "order": 2,
            "enabled": true
        },
        {
            "id": "lawyerId",
            "label": "Юрист",
            "type": "combobox",
            "dataSource": "users",
            "order": 3,
            "enabled": true
        },
        {
            "id": "outcome",
            "label": "Результат",
            "type": "select",
            "dataSource": "outcomes",
            "order": 4,
            "enabled": true
        },
        {
            "id": "tags",
            "label": "Теги",
            "type": "tags",
            "dataSource": "tags",
            "order": 5,
            "enabled": true
        }
    ],
    "enabled": true
}'::jsonb)
ON CONFLICT (module_id, setting_key) DO NOTHING;

-- Insert default bulk edit settings for calendar
INSERT INTO module_settings (module_id, setting_key, value) VALUES
('calendar', 'bulk_edit_fields', '{
    "fields": [
        {
            "id": "status",
            "label": "Статус",
            "type": "select",
            "dataSource": "statuses",
            "dataSourceModule": "calendar",
            "order": 1,
            "enabled": true
        },
        {
            "id": "manager",
            "label": "Ответственный",
            "type": "combobox",
            "dataSource": "users",
            "order": 2,
            "enabled": true
        },
        {
            "id": "tags",
            "label": "Теги",
            "type": "tags",
            "dataSource": "tags",
            "order": 3,
            "enabled": true
        }
    ],
    "enabled": true
}'::jsonb)
ON CONFLICT (module_id, setting_key) DO NOTHING;

-- Insert default bulk edit settings for finance
INSERT INTO module_settings (module_id, setting_key, value) VALUES
('finance', 'bulk_edit_fields', '{
    "fields": [
        {
            "id": "status",
            "label": "Статус",
            "type": "select",
            "dataSource": "statuses",
            "dataSourceModule": "finance",
            "order": 1,
            "enabled": true
        },
        {
            "id": "priority",
            "label": "Приоритет",
            "type": "select",
            "dataSource": "priorities",
            "dataSourceModule": "finance",
            "order": 2,
            "enabled": true
        },
        {
            "id": "manager",
            "label": "Менеджер",
            "type": "combobox",
            "dataSource": "users",
            "order": 3,
            "enabled": true
        },
        {
            "id": "tags",
            "label": "Теги",
            "type": "tags",
            "dataSource": "tags",
            "order": 4,
            "enabled": true
        }
    ],
    "enabled": true
}'::jsonb)
ON CONFLICT (module_id, setting_key) DO NOTHING;

-- Insert default bulk edit settings for contracts
INSERT INTO module_settings (module_id, setting_key, value) VALUES
('contracts', 'bulk_edit_fields', '{
    "fields": [
        {
            "id": "status",
            "label": "Статус",
            "type": "select",
            "dataSource": "statuses",
            "dataSourceModule": "contracts",
            "order": 1,
            "enabled": true
        },
        {
            "id": "manager",
            "label": "Менеджер",
            "type": "combobox",
            "dataSource": "users",
            "order": 2,
            "enabled": true
        },
        {
            "id": "tags",
            "label": "Теги",
            "type": "tags",
            "dataSource": "tags",
            "order": 3,
            "enabled": true
        }
    ],
    "enabled": true
}'::jsonb)
ON CONFLICT (module_id, setting_key) DO NOTHING;
