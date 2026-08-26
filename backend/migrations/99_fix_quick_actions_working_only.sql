-- Migration 99: Replace all quick actions with working-only set
-- Description: Keep only actions that have real implementation (sheets, navigation, phone)
-- Remove stub-only actions

-- First, deactivate all existing actions
UPDATE quick_actions SET is_active = FALSE, updated_at = CURRENT_TIMESTAMP;

-- contractors: send_email, make_call, create_task, create_claim, create_project, add_note
INSERT INTO quick_actions (id, name, icon, action, module, displayorder, is_active) VALUES
('contractors_send_email', 'Отправить письмо', 'Mail', 'send_email', 'contractors', 1, TRUE),
('contractors_make_call', 'Позвонить', 'Phone', 'make_call', 'contractors', 2, TRUE),
('contractors_create_task', 'Создать задачу', 'Plus', 'create_task', 'contractors', 3, TRUE),
('contractors_create_claim', 'Создать претензию', 'Gavel', 'create_claim', 'contractors', 4, TRUE),
('contractors_create_project', 'Создать проект', 'FolderKanban', 'create_project', 'contractors', 5, TRUE),
('contractors_add_note', 'Добавить заметку', 'StickyNote', 'add_note', 'contractors', 6, TRUE)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name, icon = EXCLUDED.icon, action = EXCLUDED.action,
    displayorder = EXCLUDED.displayorder, is_active = EXCLUDED.is_active,
    updated_at = CURRENT_TIMESTAMP;

-- projects: create_project, create_task, assign_manager, change_status
INSERT INTO quick_actions (id, name, icon, action, module, displayorder, is_active) VALUES
('projects_create_project', 'Создать проект', 'Plus', 'create_project', 'projects', 1, TRUE),
('projects_create_task', 'Создать задачу', 'CheckSquare', 'create_task', 'projects', 2, TRUE),
('projects_assign_manager', 'Назначить менеджера', 'User', 'assign_manager', 'projects', 3, TRUE),
('projects_change_status', 'Изменить статус', 'RefreshCw', 'change_status', 'projects', 4, TRUE)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name, icon = EXCLUDED.icon, action = EXCLUDED.action,
    displayorder = EXCLUDED.displayorder, is_active = EXCLUDED.is_active,
    updated_at = CURRENT_TIMESTAMP;

-- tasks: create_task, assign_task, change_status
INSERT INTO quick_actions (id, name, icon, action, module, displayorder, is_active) VALUES
('tasks_create_task', 'Создать задачу', 'Plus', 'create_task', 'tasks', 1, TRUE),
('tasks_assign_task', 'Назначить задачу', 'UserCog', 'assign_task', 'tasks', 2, TRUE),
('tasks_change_status', 'Изменить статус', 'RefreshCw', 'change_status', 'tasks', 3, TRUE)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name, icon = EXCLUDED.icon, action = EXCLUDED.action,
    displayorder = EXCLUDED.displayorder, is_active = EXCLUDED.is_active,
    updated_at = CURRENT_TIMESTAMP;

-- calendar: create_event, schedule_meeting, set_reminder
INSERT INTO quick_actions (id, name, icon, action, module, displayorder, is_active) VALUES
('calendar_create_event', 'Создать событие', 'Plus', 'create_event', 'calendar', 1, TRUE),
('calendar_schedule_meeting', 'Запланировать встречу', 'Video', 'schedule_meeting', 'calendar', 2, TRUE),
('calendar_set_reminder', 'Установить напоминание', 'Bell', 'set_reminder', 'calendar', 3, TRUE)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name, icon = EXCLUDED.icon, action = EXCLUDED.action,
    displayorder = EXCLUDED.displayorder, is_active = EXCLUDED.is_active,
    updated_at = CURRENT_TIMESTAMP;

-- lawyers: create_task, create_case
INSERT INTO quick_actions (id, name, icon, action, module, displayorder, is_active) VALUES
('lawyers_create_task', 'Создать задачу', 'Plus', 'create_task', 'lawyers', 1, TRUE),
('lawyers_create_case', 'Создать дело', 'Gavel', 'create_case', 'lawyers', 2, TRUE)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name, icon = EXCLUDED.icon, action = EXCLUDED.action,
    displayorder = EXCLUDED.displayorder, is_active = EXCLUDED.is_active,
    updated_at = CURRENT_TIMESTAMP;

-- finance: create_invoice, record_payment
INSERT INTO quick_actions (id, name, icon, action, module, displayorder, is_active) VALUES
('finance_create_invoice', 'Создать счёт', 'Plus', 'create_invoice', 'finance', 1, TRUE),
('finance_record_payment', 'Записать платёж', 'DollarSign', 'record_payment', 'finance', 2, TRUE)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name, icon = EXCLUDED.icon, action = EXCLUDED.action,
    displayorder = EXCLUDED.displayorder, is_active = EXCLUDED.is_active,
    updated_at = CURRENT_TIMESTAMP;

-- cases: create_case, assign_lawyer, add_document, send_to_court
INSERT INTO quick_actions (id, name, icon, action, module, displayorder, is_active) VALUES
('cases_create_case', 'Создать дело', 'Plus', 'create_case', 'cases', 1, TRUE),
('cases_assign_lawyer', 'Назначить юриста', 'UserCog', 'assign_lawyer', 'cases', 2, TRUE),
('cases_add_document', 'Добавить документ', 'FilePlus', 'add_document', 'cases', 3, TRUE),
('cases_send_to_court', 'Отправить в суд', 'Send', 'send_to_court', 'cases', 4, TRUE)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name, icon = EXCLUDED.icon, action = EXCLUDED.action,
    displayorder = EXCLUDED.displayorder, is_active = EXCLUDED.is_active,
    updated_at = CURRENT_TIMESTAMP;

-- mail: compose, inbox
INSERT INTO quick_actions (id, name, icon, action, module, displayorder, is_active) VALUES
('mail_compose', 'Написать письмо', 'Mail', 'send_email', 'mail', 1, TRUE),
('mail_inbox', 'Входящие', 'Inbox', 'view_inbox', 'mail', 2, TRUE)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name, icon = EXCLUDED.icon, action = EXCLUDED.action,
    displayorder = EXCLUDED.displayorder, is_active = EXCLUDED.is_active,
    updated_at = CURRENT_TIMESTAMP;

-- documents: upload (если есть upload dialog)
-- Skip for now - no sheet exists

-- Verify result
SELECT module, COUNT(*) as active_actions
FROM quick_actions
WHERE is_active = TRUE
GROUP BY module
ORDER BY module;
