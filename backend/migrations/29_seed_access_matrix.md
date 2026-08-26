# Migration 29: Seed Complete Access Matrix

## Description
Seed the database with comprehensive roles, permissions, and quick actions for the access control system.

## SQL Statements

```sql
-- ============================================
-- ROLES
-- ============================================

-- Clear existing roles (preserve admin)
DELETE FROM roles WHERE id NOT IN ('admin');

-- Insert extended roles
INSERT INTO roles (id, name, description, permissions) VALUES
('admin', 'Администратор', 'Полный доступ ко всем функциям системы',
 '["users.*", "roles.*", "permissions.*", "settings.*", "contractors.*", "projects.*", "tasks.*", "documents.*", "cases.*", "lawyers.*", "finance.*", "calendar.*", "mail.*", "reports.*", "backups.*"]'),

('manager', 'Менеджер', 'Управление проектами, клиентами и задачами', 
 '["contractors.read", "contractors.write", "contractors.delete", 
   "projects.*", "tasks.*", "documents.*", 
   "cases.read", "cases.write", 
   "calendar.*", "mail.*", "reports.read"]'),

('lawyer', 'Юрист', 'Работа с юридическими делами и документами', 
 '["contractors.read", 
   "projects.read", 
   "tasks.read", "tasks.write", 
   "documents.*", 
   "cases.*", 
   "calendar.*", "mail.read", "mail.write"]'),

('accountant', 'Бухгалтер', 'Доступ к финансовым данным и отчётам', 
 '["contractors.read", 
   "projects.read", 
   "documents.read", 
   "cases.read", 
   "reports.read", "reports.write"]'),

('user', 'Пользователь', 'Базовый доступ к функциям', 
 '["contractors.read", 
   "projects.read", 
   "tasks.read", "tasks.write", 
   "documents.read", 
   "calendar.read", 
   "mail.read", "mail.write"]'),

('viewer', 'Наблюдатель', 'Только просмотр без возможности изменения', 
 '["contractors.read", 
   "projects.read", 
   "tasks.read", 
   "documents.read", 
   "cases.read", 
   "calendar.read"]')
ON CONFLICT (id) DO UPDATE SET 
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  permissions = EXCLUDED.permissions,
  updated_at = CURRENT_TIMESTAMP;

-- ============================================
-- PERMISSIONS
-- ============================================

-- Clear existing permissions
DELETE FROM permissions;

-- Users permissions
INSERT INTO permissions (id, name, description, category, resource, action) VALUES
('users.read', 'Просмотр пользователей', 'Просмотр списка пользователей', 'users', 'users', 'read'),
('users.write', 'Управление пользователями', 'Создание и редактирование пользователей', 'users', 'users', 'write'),
('users.delete', 'Удаление пользователей', 'Удаление пользователей из системы', 'users', 'users', 'delete');

-- Roles permissions
INSERT INTO permissions (id, name, description, category, resource, action) VALUES
('roles.read', 'Просмотр ролей', 'Просмотр списка ролей', 'roles', 'roles', 'read'),
('roles.write', 'Управление ролями', 'Создание и редактирование ролей', 'roles', 'roles', 'write'),
('roles.delete', 'Удаление ролей', 'Удаление ролей из системы', 'roles', 'roles', 'delete');

-- Permissions permissions
INSERT INTO permissions (id, name, description, category, resource, action) VALUES
('permissions.read', 'Просмотр прав доступа', 'Просмотр прав доступа', 'permissions', 'permissions', 'read'),
('permissions.write', 'Управление правами доступа', 'Создание и редактирование прав доступа', 'permissions', 'permissions', 'write');

-- Settings permissions
INSERT INTO permissions (id, name, description, category, resource, action) VALUES
('settings.read', 'Просмотр настроек', 'Просмотр системных настроек', 'settings', 'settings', 'read'),
('settings.write', 'Управление настройками', 'Изменение системных настроек', 'settings', 'settings', 'write');

-- Contractors permissions
INSERT INTO permissions (id, name, description, category, resource, action) VALUES
('contractors.read', 'Просмотр контрагентов', 'Просмотр списка контрагентов', 'contractors', 'contractors', 'read'),
('contractors.write', 'Управление контрагентами', 'Создание и редактирование контрагентов', 'contractors', 'contractors', 'write'),
('contractors.delete', 'Удаление контрагентов', 'Удаление контрагентов', 'contractors', 'contractors', 'delete');

-- Projects permissions
INSERT INTO permissions (id, name, description, category, resource, action) VALUES
('projects.read', 'Просмотр проектов', 'Просмотр списка проектов', 'projects', 'projects', 'read'),
('projects.write', 'Управление проектами', 'Создание и редактирование проектов', 'projects', 'projects', 'write'),
('projects.delete', 'Удаление проектов', 'Удаление проектов', 'projects', 'projects', 'delete');

-- Tasks permissions
INSERT INTO permissions (id, name, description, category, resource, action) VALUES
('tasks.read', 'Просмотр задач', 'Просмотр списка задач', 'tasks', 'tasks', 'read'),
('tasks.write', 'Управление задачами', 'Создание и редактирование задач', 'tasks', 'tasks', 'write'),
('tasks.delete', 'Удаление задач', 'Удаление задач', 'tasks', 'tasks', 'delete');

-- Documents permissions
INSERT INTO permissions (id, name, description, category, resource, action) VALUES
('documents.read', 'Просмотр документов', 'Просмотр документов', 'documents', 'documents', 'read'),
('documents.write', 'Управление документами', 'Создание и редактирование документов', 'documents', 'documents', 'write'),
('documents.delete', 'Удаление документов', 'Удаление документов', 'documents', 'documents', 'delete'),
('documents.upload', 'Загрузка документов', 'Загрузка файлов в систему', 'documents', 'documents', 'upload');

-- Cases permissions
INSERT INTO permissions (id, name, description, category, resource, action) VALUES
('cases.read', 'Просмотр дел', 'Просмотр юридических дел', 'cases', 'cases', 'read'),
('cases.write', 'Управление делами', 'Создание и редактирование дел', 'cases', 'cases', 'write'),
('cases.delete', 'Удаление дел', 'Удаление дел', 'cases', 'cases', 'delete');

-- Calendar permissions
INSERT INTO permissions (id, name, description, category, resource, action) VALUES
('calendar.read', 'Просмотр календаря', 'Просмотр событий календаря', 'calendar', 'calendar', 'read'),
('calendar.write', 'Управление календарём', 'Создание и редактирование событий', 'calendar', 'calendar', 'write'),
('calendar.delete', 'Удаление событий', 'Удаление событий календаря', 'calendar', 'calendar', 'delete');

-- Mail permissions
INSERT INTO permissions (id, name, description, category, resource, action) VALUES
('mail.read', 'Просмотр почты', 'Просмотр писем', 'mail', 'mail', 'read'),
('mail.write', 'Управление почтой', 'Создание и отправка писем', 'mail', 'mail', 'write'),
('mail.delete', 'Удаление почты', 'Удаление писем', 'mail', 'mail', 'delete');

-- Reports permissions
INSERT INTO permissions (id, name, description, category, resource, action) VALUES
('reports.read', 'Просмотр отчётов', 'Просмотр отчётов и статистики', 'reports', 'reports', 'read'),
('reports.write', 'Создание отчётов', 'Создание пользовательских отчётов', 'reports', 'reports', 'write'),
('reports.export', 'Экспорт отчётов', 'Экспорт отчётов в различные форматы', 'reports', 'reports', 'export');

-- ============================================
-- QUICK ACTIONS
-- ============================================

-- Clear existing quick actions
DELETE FROM quick_actions;

-- Quick actions for Tasks module
INSERT INTO quick_actions (id, name, icon, action, module, displayorder, is_active) VALUES
('qa_task_1', 'Создать задачу', 'Plus', 'create_task', 'tasks', 1, true),
('qa_task_2', 'Назначить задачу', 'UserPlus', 'assign_task', 'tasks', 2, true),
('qa_task_3', 'Изменить статус', 'ArrowRight', 'change_status', 'tasks', 3, true),
('qa_task_4', 'Добавить комментарий', 'MessageSquare', 'add_comment', 'tasks', 4, true),
('qa_task_5', 'Прикрепить файл', 'Paperclip', 'attach_file', 'tasks', 5, true);

-- Quick actions for Projects module
INSERT INTO quick_actions (id, name, icon, action, module, displayorder, is_active) VALUES
('qa_proj_1', 'Создать проект', 'FolderPlus', 'create_project', 'projects', 1, true),
('qa_proj_2', 'Назначить менеджера', 'UserCog', 'assign_manager', 'projects', 2, true),
('qa_proj_3', 'Изменить статус', 'Flag', 'change_status', 'projects', 3, true),
('qa_proj_4', 'Экспорт отчёта', 'Download', 'export_report', 'projects', 4, true),
('qa_proj_5', 'Просмотр задач', 'List', 'view_tasks', 'projects', 5, true);

-- Quick actions for Contractors module
INSERT INTO quick_actions (id, name, icon, action, module, displayorder, is_active) VALUES
('qa_cont_1', 'Добавить контрагента', 'UserPlus', 'add_contractor', 'contractors', 1, true),
('qa_cont_2', 'Отправить письмо', 'Mail', 'send_email', 'contractors', 2, true),
('qa_cont_3', 'Добавить заметку', 'StickyNote', 'add_note', 'contractors', 3, true),
('qa_cont_4', 'Создать договор', 'FileSignature', 'create_contract', 'contractors', 4, true),
('qa_cont_5', 'Позвонить', 'Phone', 'make_call', 'contractors', 5, true),
('qa_cont_6', 'Назначить встречу', 'Calendar', 'schedule_meeting', 'contractors', 6, true);

-- Quick actions for Cases module
INSERT INTO quick_actions (id, name, icon, action, module, displayorder, is_active) VALUES
('qa_case_1', 'Создать дело', 'FilePlus', 'create_case', 'cases', 1, true),
('qa_case_2', 'Назначить юриста', 'UserCheck', 'assign_lawyer', 'cases', 2, true),
('qa_case_3', 'Загрузить документ', 'Upload', 'upload_document', 'cases', 3, true),
('qa_case_4', 'Добавить событие', 'PlusCircle', 'add_event', 'cases', 4, true),
('qa_case_5', 'Отправить в суд', 'Send', 'send_to_court', 'cases', 5, true),
('qa_case_6', 'Финансовые данные', 'DollarSign', 'financial_details', 'cases', 6, true);

-- Quick actions for Calendar module
INSERT INTO quick_actions (id, name, icon, action, module, displayorder, is_active) VALUES
('qa_cal_1', 'Создать событие', 'Plus', 'create_event', 'calendar', 1, true),
('qa_cal_2', 'Запланировать встречу', 'Video', 'schedule_meeting', 'calendar', 2, true),
('qa_cal_3', 'Напоминание', 'Bell', 'set_reminder', 'calendar', 3, true),
('qa_cal_4', 'Просмотр дня', 'Calendar', 'day_view', 'calendar', 4, true);

-- Quick actions for Documents module
INSERT INTO quick_actions (id, name, icon, action, module, displayorder, is_active) VALUES
('qa_doc_1', 'Загрузить документ', 'Upload', 'upload_document', 'documents', 1, true),
('qa_doc_2', 'Создать папку', 'FolderPlus', 'create_folder', 'documents', 2, true),
('qa_doc_3', 'Поиск документов', 'Search', 'search_documents', 'documents', 3, true),
('qa_doc_4', 'Экспорт документов', 'Download', 'export_documents', 'documents', 4, true);

-- ============================================
-- UPDATE EXISTING USERS
-- ============================================

-- Update existing users with default role
UPDATE users SET role = 'user' WHERE role IS NULL OR role = '';

-- Set specific roles for admin users (case-insensitive match for both Russian and English)
UPDATE users SET role = 'admin' WHERE role ILIKE '%admin%' OR role ILIKE '%админ%';
UPDATE users SET role = 'manager' WHERE role ILIKE '%manager%' OR role ILIKE '%менеджер%';
UPDATE users SET role = 'lawyer' WHERE department ILIKE '%legal%' OR role ILIKE '%юрист%';
```