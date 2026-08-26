-- ============================================
-- Add missing quick actions for Contractors and Cases modules
-- ============================================

-- Clear existing quick actions for these modules to avoid duplicates
DELETE FROM quick_actions WHERE module IN ('contractors', 'cases');

-- Quick actions for Contractors module (updated)
INSERT INTO quick_actions (id, name, icon, action, module, displayorder, is_active) VALUES
('qa_cont_1', 'Добавить контрагента', 'UserPlus', 'add_contractor', 'contractors', 1, true),
('qa_cont_2', 'Создать проект', 'FolderPlus', 'create_project', 'contractors', 2, true),
('qa_cont_3', 'Создать задачу', 'Plus', 'create_task', 'contractors', 3, true),
('qa_cont_4', 'Отправить письмо', 'Mail', 'send_email', 'contractors', 4, true),
('qa_cont_5', 'Добавить заметку', 'StickyNote', 'add_note', 'contractors', 5, true),
('qa_cont_6', 'Создать договор', 'FileSignature', 'create_contract', 'contractors', 6, true),
('qa_cont_7', 'Позвонить', 'Phone', 'make_call', 'contractors', 7, true),
('qa_cont_8', 'Назначить встречу', 'Calendar', 'schedule_meeting', 'contractors', 8, true),
('qa_cont_9', 'Создать претензию', 'FileText', 'create_claim', 'contractors', 9, true);

-- Quick actions for Lawyers module
INSERT INTO quick_actions (id, name, icon, action, module, displayorder, is_active) VALUES
('qa_law_1', 'Создать задачу', 'Plus', 'create_task', 'lawyers', 1, true);

-- Quick actions for Cases module (updated)
INSERT INTO quick_actions (id, name, icon, action, module, displayorder, is_active) VALUES
('qa_case_1', 'Создать дело', 'FilePlus', 'create_case', 'cases', 1, true),
('qa_case_2', 'Назначить юриста', 'UserCheck', 'assign_lawyer', 'cases', 2, true),
('qa_case_3', 'Загрузить документ', 'Upload', 'upload_document', 'cases', 3, true),
('qa_case_4', 'Добавить событие', 'PlusCircle', 'add_event', 'cases', 4, true),
('qa_case_5', 'Добавить документ', 'File', 'add_document', 'cases', 5, true),
('qa_case_6', 'Финансовые данные', 'DollarSign', 'financial_details', 'cases', 6, true),
('qa_case_7', 'Отправить в суд', 'Send', 'send_to_court', 'cases', 7, true),
('qa_case_8', 'Вернуть в претензию', 'ArrowLeft', 'return_to_claim', 'cases', 8, true);
