-- Migration 98: Add quick actions for all modules
-- Description: Fill in typical quick actions for modules that were missing them

-- mail (Почта)
INSERT INTO quick_actions (id, name, icon, action, module, displayorder, is_active) VALUES
('mail_compose', 'Написать письмо', 'Mail', 'send_email', 'mail', 1, TRUE),
('mail_inbox', 'Входящие', 'Inbox', 'view_inbox', 'mail', 2, TRUE),
('mail_sent', 'Отправленные', 'Send', 'view_sent', 'mail', 3, TRUE),
('mail_drafts', 'Черновики', 'FileText', 'view_drafts', 'mail', 4, TRUE)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name, icon = EXCLUDED.icon, action = EXCLUDED.action,
    displayorder = EXCLUDED.displayorder, is_active = EXCLUDED.is_active,
    updated_at = CURRENT_TIMESTAMP;

-- documents (Документы)
INSERT INTO quick_actions (id, name, icon, action, module, displayorder, is_active) VALUES
('documents_upload', 'Загрузить документ', 'Upload', 'upload_document', 'documents', 1, TRUE),
('documents_create_folder', 'Создать папку', 'FolderPlus', 'create_folder', 'documents', 2, TRUE),
('documents_search', 'Поиск документов', 'Search', 'search_documents', 'documents', 3, TRUE),
('documents_export', 'Экспорт документов', 'Download', 'export_documents', 'documents', 4, TRUE)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name, icon = EXCLUDED.icon, action = EXCLUDED.action,
    displayorder = EXCLUDED.displayorder, is_active = EXCLUDED.is_active,
    updated_at = CURRENT_TIMESTAMP;

-- calendar (Календарь)
INSERT INTO quick_actions (id, name, icon, action, module, displayorder, is_active) VALUES
('calendar_create_event', 'Создать событие', 'Plus', 'create_event', 'calendar', 1, TRUE),
('calendar_schedule_meeting', 'Запланировать встречу', 'Calendar', 'schedule_meeting', 'calendar', 2, TRUE),
('calendar_set_reminder', 'Установить напоминание', 'Bell', 'set_reminder', 'calendar', 3, TRUE),
('calendar_day_view', 'Просмотр дня', 'List', 'day_view', 'calendar', 4, TRUE)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name, icon = EXCLUDED.icon, action = EXCLUDED.action,
    displayorder = EXCLUDED.displayorder, is_active = EXCLUDED.is_active,
    updated_at = CURRENT_TIMESTAMP;

-- tasks (Задачи) — расширенный набор
INSERT INTO quick_actions (id, name, icon, action, module, displayorder, is_active) VALUES
('tasks_create_task', 'Создать задачу', 'Plus', 'create_task', 'tasks', 1, TRUE),
('tasks_assign_task', 'Назначить задачу', 'UserCog', 'assign_task', 'tasks', 2, TRUE),
('tasks_change_status', 'Изменить статус', 'RefreshCw', 'change_status', 'tasks', 3, TRUE),
('tasks_add_comment', 'Добавить комментарий', 'MessageSquare', 'add_comment', 'tasks', 4, TRUE),
('tasks_attach_file', 'Прикрепить файл', 'Paperclip', 'attach_file', 'tasks', 5, TRUE)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name, icon = EXCLUDED.icon, action = EXCLUDED.action,
    displayorder = EXCLUDED.displayorder, is_active = EXCLUDED.is_active,
    updated_at = CURRENT_TIMESTAMP;

-- lawyers (Юристы) — расширенный набор
INSERT INTO quick_actions (id, name, icon, action, module, displayorder, is_active) VALUES
('lawyers_create_task', 'Создать задачу', 'Plus', 'create_task', 'lawyers', 1, TRUE),
('lawyers_create_case', 'Создать дело', 'Gavel', 'create_case', 'lawyers', 2, TRUE),
('lawyers_schedule_meeting', 'Назначить встречу', 'Calendar', 'schedule_meeting', 'lawyers', 3, TRUE),
('lawyers_add_document', 'Добавить документ', 'FilePlus', 'add_document', 'lawyers', 4, TRUE),
('lawyers_send_email', 'Отправить письмо', 'Mail', 'send_email', 'lawyers', 5, TRUE)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name, icon = EXCLUDED.icon, action = EXCLUDED.action,
    displayorder = EXCLUDED.displayorder, is_active = EXCLUDED.is_active,
    updated_at = CURRENT_TIMESTAMP;

-- projects (Проекты) — полный набор
INSERT INTO quick_actions (id, name, icon, action, module, displayorder, is_active) VALUES
('projects_create_project', 'Создать проект', 'Plus', 'create_project', 'projects', 1, TRUE),
('projects_create_task', 'Создать задачу', 'CheckSquare', 'create_task', 'projects', 2, TRUE),
('projects_assign_manager', 'Назначить менеджера', 'User', 'assign_manager', 'projects', 3, TRUE),
('projects_change_status', 'Изменить статус', 'RefreshCw', 'change_status', 'projects', 4, TRUE),
('projects_export_report', 'Экспорт отчёта', 'Download', 'export_report', 'projects', 5, TRUE)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name, icon = EXCLUDED.icon, action = EXCLUDED.action,
    displayorder = EXCLUDED.displayorder, is_active = EXCLUDED.is_active,
    updated_at = CURRENT_TIMESTAMP;

-- contractors (Контрагенты) — полный набор
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

-- cases (Дела) — полный набор
INSERT INTO quick_actions (id, name, icon, action, module, displayorder, is_active) VALUES
('cases_create_case', 'Создать дело', 'Plus', 'create_case', 'cases', 1, TRUE),
('cases_assign_lawyer', 'Назначить юриста', 'UserCog', 'assign_lawyer', 'cases', 2, TRUE),
('cases_add_document', 'Добавить документ', 'FilePlus', 'add_document', 'cases', 3, TRUE),
('cases_send_to_court', 'Отправить в суд', 'Send', 'send_to_court', 'cases', 4, TRUE),
('cases_add_event', 'Добавить событие', 'Calendar', 'add_event', 'cases', 5, TRUE)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name, icon = EXCLUDED.icon, action = EXCLUDED.action,
    displayorder = EXCLUDED.displayorder, is_active = EXCLUDED.is_active,
    updated_at = CURRENT_TIMESTAMP;

-- finance (Финансы) — полный набор
INSERT INTO quick_actions (id, name, icon, action, module, displayorder, is_active) VALUES
('finance_create_invoice', 'Создать счёт', 'Plus', 'create_invoice', 'finance', 1, TRUE),
('finance_record_payment', 'Записать платёж', 'DollarSign', 'record_payment', 'finance', 2, TRUE),
('finance_generate_document', 'Сформировать документ', 'FileText', 'generate_document', 'finance', 3, TRUE),
('finance_export_report', 'Экспорт отчёта', 'Download', 'export_report', 'finance', 4, TRUE)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name, icon = EXCLUDED.icon, action = EXCLUDED.action,
    displayorder = EXCLUDED.displayorder, is_active = EXCLUDED.is_active,
    updated_at = CURRENT_TIMESTAMP;
