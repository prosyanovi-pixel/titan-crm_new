-- Migration 97: Create quick_actions table and seed all quick actions
-- Based on frontend/src/modules/registry/referenceSeeds.js

-- Create table if not exists
CREATE TABLE IF NOT EXISTS quick_actions (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    icon VARCHAR(50) NOT NULL,
    action VARCHAR(50) NOT NULL,
    module VARCHAR(50) NOT NULL,
    displayorder INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for faster module-based queries
CREATE INDEX IF NOT EXISTS idx_quick_actions_module ON quick_actions(module);
CREATE INDEX IF NOT EXISTS idx_quick_actions_action ON quick_actions(action);

-- Seed all quick actions from referenceSeeds.js
-- contractors
INSERT INTO quick_actions (id, name, icon, action, module, displayorder, is_active) VALUES
('contractors_send_email', 'Отправить письмо', 'Mail', 'send_email', 'contractors', 1, TRUE),
('contractors_make_call', 'Позвонить', 'Phone', 'make_call', 'contractors', 2, TRUE),
('contractors_create_task', 'Создать задачу', 'Plus', 'create_task', 'contractors', 3, TRUE),
('contractors_create_claim', 'Создать претензию', 'Gavel', 'create_claim', 'contractors', 4, TRUE),
('contractors_create_project', 'Создать проект', 'FolderKanban', 'create_project', 'contractors', 5, TRUE)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    icon = EXCLUDED.icon,
    action = EXCLUDED.action,
    module = EXCLUDED.module,
    displayorder = EXCLUDED.displayorder,
    is_active = EXCLUDED.is_active,
    updated_at = CURRENT_TIMESTAMP;

-- projects
INSERT INTO quick_actions (id, name, icon, action, module, displayorder, is_active) VALUES
('projects_create_project', 'Создать проект', 'Plus', 'create_project', 'projects', 1, TRUE),
('projects_create_task', 'Создать задачу', 'CheckSquare', 'create_task', 'projects', 2, TRUE),
('projects_assign_manager', 'Назначить менеджера', 'User', 'assign_manager', 'projects', 3, TRUE),
('projects_change_status', 'Изменить статус', 'RefreshCw', 'change_status', 'projects', 4, TRUE)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    icon = EXCLUDED.icon,
    action = EXCLUDED.action,
    module = EXCLUDED.module,
    displayorder = EXCLUDED.displayorder,
    is_active = EXCLUDED.is_active,
    updated_at = CURRENT_TIMESTAMP;

-- tasks
INSERT INTO quick_actions (id, name, icon, action, module, displayorder, is_active) VALUES
('tasks_create_task', 'Создать задачу', 'Plus', 'create_task', 'tasks', 1, TRUE)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    icon = EXCLUDED.icon,
    action = EXCLUDED.action,
    module = EXCLUDED.module,
    displayorder = EXCLUDED.displayorder,
    is_active = EXCLUDED.is_active,
    updated_at = CURRENT_TIMESTAMP;

-- lawyers
INSERT INTO quick_actions (id, name, icon, action, module, displayorder, is_active) VALUES
('lawyers_create_task', 'Создать задачу', 'Plus', 'create_task', 'lawyers', 1, TRUE)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    icon = EXCLUDED.icon,
    action = EXCLUDED.action,
    module = EXCLUDED.module,
    displayorder = EXCLUDED.displayorder,
    is_active = EXCLUDED.is_active,
    updated_at = CURRENT_TIMESTAMP;

-- finance
INSERT INTO quick_actions (id, name, icon, action, module, displayorder, is_active) VALUES
('finance_create_invoice', 'Создать счёт', 'Plus', 'create_invoice', 'finance', 1, TRUE),
('finance_record_payment', 'Записать платёж', 'DollarSign', 'record_payment', 'finance', 2, TRUE),
('finance_generate_document', 'Сформировать документ', 'FileText', 'generate_document', 'finance', 3, TRUE)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    icon = EXCLUDED.icon,
    action = EXCLUDED.action,
    module = EXCLUDED.module,
    displayorder = EXCLUDED.displayorder,
    is_active = EXCLUDED.is_active,
    updated_at = CURRENT_TIMESTAMP;
