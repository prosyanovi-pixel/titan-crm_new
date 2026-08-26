-- Seed script: Заполнение module_settings базовыми настройками массового редактирования
-- Date: 2026-03-25
-- Updated: Все модули с таблицами

-- Contractors
INSERT INTO module_settings (module_id, setting_key, value) VALUES
('contractors', 'bulk_edit_fields', '{
    "fields": [
        {"id": "status", "label": "Статус", "type": "select", "dataSource": "statuses", "dataSourceModule": "contractors", "order": 1, "enabled": true, "columnName": "status"},
        {"id": "type", "label": "Тип отношения", "type": "select", "dataSource": "relationshipTypes", "dataSourceModule": "contractors", "order": 2, "enabled": true, "columnName": "type"},
        {"id": "legal_form", "label": "Правовая форма", "type": "select", "dataSource": "legalForms", "order": 3, "enabled": true, "columnName": "legal_form"},
        {"id": "manager", "label": "Менеджер", "type": "combobox", "dataSource": "users", "order": 4, "enabled": true, "columnName": "manager"},
        {"id": "email", "label": "Email", "type": "text", "order": 5, "enabled": true, "columnName": "email"},
        {"id": "phone", "label": "Телефон", "type": "text", "order": 6, "enabled": true, "columnName": "phone"},
        {"id": "tags", "label": "Теги", "type": "tags", "dataSource": "tags", "order": 7, "enabled": true, "columnName": "tags"}
    ],
    "enabled": true
}'::jsonb)
ON CONFLICT (module_id, setting_key) DO UPDATE SET
    value = EXCLUDED.value,
    updated_at = CURRENT_TIMESTAMP;

-- Projects
INSERT INTO module_settings (module_id, setting_key, value) VALUES
('projects', 'bulk_edit_fields', '{
    "fields": [
        {"id": "status", "label": "Статус", "type": "select", "dataSource": "statuses", "dataSourceModule": "projects", "order": 1, "enabled": true, "columnName": "status"},
        {"id": "priority", "label": "Приоритет", "type": "select", "dataSource": "priorities", "dataSourceModule": "projects", "order": 2, "enabled": true, "columnName": "priority"},
        {"id": "manager", "label": "Менеджер", "type": "combobox", "dataSource": "users", "order": 3, "enabled": true, "columnName": "manager"},
        {"id": "contractor_id", "label": "Клиент", "type": "combobox", "dataSource": "contractors", "order": 4, "enabled": true, "columnName": "contractor_id"},
        {"id": "budget", "label": "Бюджет", "type": "number", "order": 5, "enabled": true, "columnName": "budget"},
        {"id": "deadline", "label": "Дедлайн", "type": "date", "order": 6, "enabled": true, "columnName": "deadline"},
        {"id": "tags", "label": "Теги", "type": "tags", "dataSource": "tags", "order": 7, "enabled": true, "columnName": "tags"}
    ],
    "enabled": true
}'::jsonb)
ON CONFLICT (module_id, setting_key) DO UPDATE SET
    value = EXCLUDED.value,
    updated_at = CURRENT_TIMESTAMP;

-- Tasks
INSERT INTO module_settings (module_id, setting_key, value) VALUES
('tasks', 'bulk_edit_fields', '{
    "fields": [
        {"id": "status", "label": "Статус", "type": "select", "dataSource": "statuses", "dataSourceModule": "tasks", "order": 1, "enabled": true, "columnName": "status"},
        {"id": "priority", "label": "Приоритет", "type": "select", "dataSource": "priorities", "dataSourceModule": "tasks", "order": 2, "enabled": true, "columnName": "priority"},
        {"id": "assignee", "label": "Исполнитель", "type": "combobox", "dataSource": "users", "order": 3, "enabled": true, "columnName": "assignee"},
        {"id": "folderId", "label": "Папка", "type": "select", "dataSource": "folders", "order": 4, "enabled": true, "columnName": "folder_id"},
        {"id": "projectId", "label": "Проект", "type": "combobox", "dataSource": "projects", "order": 5, "enabled": true, "columnName": "project_id"},
        {"id": "dueDate", "label": "Срок", "type": "date", "order": 6, "enabled": true, "columnName": "due_date"},
        {"id": "tags", "label": "Теги", "type": "tags", "dataSource": "tags", "order": 7, "enabled": true, "columnName": "tags"}
    ],
    "enabled": true
}'::jsonb)
ON CONFLICT (module_id, setting_key) DO UPDATE SET
    value = EXCLUDED.value,
    updated_at = CURRENT_TIMESTAMP;

-- Documents
INSERT INTO module_settings (module_id, setting_key, value) VALUES
('documents', 'bulk_edit_fields', '{
    "fields": [
        {"id": "folderId", "label": "Папка", "type": "select", "dataSource": "folders", "order": 1, "enabled": true, "columnName": "folder_id"},
        {"id": "status", "label": "Статус", "type": "select", "dataSource": "statuses", "dataSourceModule": "documents", "order": 2, "enabled": true, "columnName": "status"},
        {"id": "projectId", "label": "Проект", "type": "combobox", "dataSource": "projects", "order": 3, "enabled": true, "columnName": "project_id"},
        {"id": "contractorId", "label": "Контрагент", "type": "combobox", "dataSource": "contractors", "order": 4, "enabled": true, "columnName": "contractor_id"},
        {"id": "tags", "label": "Теги", "type": "tags", "dataSource": "tags", "order": 5, "enabled": true, "columnName": "tags"}
    ],
    "enabled": true
}'::jsonb)
ON CONFLICT (module_id, setting_key) DO UPDATE SET
    value = EXCLUDED.value,
    updated_at = CURRENT_TIMESTAMP;

-- Mail
INSERT INTO module_settings (module_id, setting_key, value) VALUES
('mail', 'bulk_edit_fields', '{
    "fields": [
        {"id": "folderId", "label": "Папка", "type": "select", "dataSource": "folders", "order": 1, "enabled": true, "columnName": "folder_id"},
        {"id": "status", "label": "Статус", "type": "select", "dataSource": "statuses", "dataSourceModule": "mail", "order": 2, "enabled": true, "columnName": "status"},
        {"id": "tags", "label": "Теги", "type": "tags", "dataSource": "tags", "order": 3, "enabled": true, "columnName": "tags"}
    ],
    "enabled": true
}'::jsonb)
ON CONFLICT (module_id, setting_key) DO UPDATE SET
    value = EXCLUDED.value,
    updated_at = CURRENT_TIMESTAMP;

-- Lawyers (Cases)
INSERT INTO module_settings (module_id, setting_key, value) VALUES
('lawyers', 'bulk_edit_fields', '{
    "fields": [
        {"id": "status", "label": "Статус", "type": "select", "dataSource": "statuses", "dataSourceModule": "lawyers", "order": 1, "enabled": true, "columnName": "status"},
        {"id": "priority", "label": "Приоритет", "type": "select", "dataSource": "priorities", "dataSourceModule": "lawyers", "order": 2, "enabled": true, "columnName": "priority"},
        {"id": "lawyerId", "label": "Юрист", "type": "combobox", "dataSource": "users", "order": 3, "enabled": true, "columnName": "lawyer_user_id"},
        {"id": "clientId", "label": "Клиент", "type": "combobox", "dataSource": "contractors", "order": 4, "enabled": true, "columnName": "client_id"},
        {"id": "outcome", "label": "Результат", "type": "select", "dataSource": "outcomes", "order": 5, "enabled": true, "columnName": "outcome"},
        {"id": "courtId", "label": "Суд", "type": "combobox", "dataSource": "courts", "order": 6, "enabled": true, "columnName": "court_id"},
        {"id": "tags", "label": "Теги", "type": "tags", "dataSource": "tags", "order": 7, "enabled": true, "columnName": "tags"}
    ],
    "enabled": true
}'::jsonb)
ON CONFLICT (module_id, setting_key) DO UPDATE SET
    value = EXCLUDED.value,
    updated_at = CURRENT_TIMESTAMP;

-- Cases (отдельно для дел юристов)
INSERT INTO module_settings (module_id, setting_key, value) VALUES
('cases', 'bulk_edit_fields', '{
    "fields": [
        {"id": "status", "label": "Статус", "type": "select", "dataSource": "statuses", "dataSourceModule": "cases", "order": 1, "enabled": true, "columnName": "status"},
        {"id": "lawyerId", "label": "Юрист", "type": "combobox", "dataSource": "users", "order": 2, "enabled": true, "columnName": "lawyer_user_id"},
        {"id": "clientId", "label": "Клиент", "type": "combobox", "dataSource": "contractors", "order": 3, "enabled": true, "columnName": "client_id"},
        {"id": "outcome", "label": "Результат", "type": "select", "dataSource": "outcomes", "order": 4, "enabled": true, "columnName": "outcome"},
        {"id": "tags", "label": "Теги", "type": "tags", "dataSource": "tags", "order": 5, "enabled": true, "columnName": "tags"}
    ],
    "enabled": true
}'::jsonb)
ON CONFLICT (module_id, setting_key) DO UPDATE SET
    value = EXCLUDED.value,
    updated_at = CURRENT_TIMESTAMP;

-- Calendar
INSERT INTO module_settings (module_id, setting_key, value) VALUES
('calendar', 'bulk_edit_fields', '{
    "fields": [
        {"id": "status", "label": "Статус", "type": "select", "dataSource": "statuses", "dataSourceModule": "calendar", "order": 1, "enabled": true, "columnName": "status"},
        {"id": "type", "label": "Тип", "type": "select", "dataSource": "calendarTypes", "order": 2, "enabled": true, "columnName": "type"},
        {"id": "assignee", "label": "Ответственный", "type": "combobox", "dataSource": "users", "order": 3, "enabled": true, "columnName": "assignee"},
        {"id": "clientId", "label": "Клиент", "type": "combobox", "dataSource": "contractors", "order": 4, "enabled": true, "columnName": "client"},
        {"id": "projectId", "label": "Проект", "type": "combobox", "dataSource": "projects", "order": 5, "enabled": true, "columnName": "project_id"},
        {"id": "tags", "label": "Теги", "type": "tags", "dataSource": "tags", "order": 6, "enabled": true, "columnName": "tags"}
    ],
    "enabled": true
}'::jsonb)
ON CONFLICT (module_id, setting_key) DO UPDATE SET
    value = EXCLUDED.value,
    updated_at = CURRENT_TIMESTAMP;

-- Finance
INSERT INTO module_settings (module_id, setting_key, value) VALUES
('finance', 'bulk_edit_fields', '{
    "fields": [
        {"id": "status", "label": "Статус (счета)", "type": "select", "dataSource": "statuses", "dataSourceModule": "finance", "order": 1, "enabled": true, "applicableTo": ["invoices"], "columnName": "status"},
        {"id": "invoice_type", "label": "Тип счёта", "type": "select", "dataSource": "invoiceTypes", "order": 2, "enabled": true, "applicableTo": ["invoices"], "columnName": "invoice_type"},
        {"id": "category_id", "label": "Статья ДДС (платежи)", "type": "select", "dataSource": "expenseCategories", "dataSourceModule": "finance", "order": 3, "enabled": true, "applicableTo": ["payments"], "columnName": "category_id"},
        {"id": "contractor_id", "label": "Контрагент", "type": "combobox", "dataSource": "contractors", "order": 4, "enabled": true, "applicableTo": ["payments", "invoices"], "columnName": "contractor_id"},
        {"id": "project_id", "label": "Проект", "type": "combobox", "dataSource": "projects", "order": 5, "enabled": true, "applicableTo": ["payments", "invoices"], "columnName": "project_id"},
        {"id": "task_id", "label": "Задача", "type": "combobox", "dataSource": "tasks", "order": 6, "enabled": true, "applicableTo": ["payments"], "columnName": "task_id"},
        {"id": "lawyer_user_id", "label": "Юрист", "type": "combobox", "dataSource": "users", "order": 7, "enabled": true, "applicableTo": ["invoices"], "columnName": "lawyer_user_id"},
        {"id": "method", "label": "Способ оплаты", "type": "select", "dataSource": "paymentMethods", "order": 8, "enabled": true, "applicableTo": ["payments"], "columnName": "method"},
        {"id": "currency", "label": "Валюта", "type": "select", "dataSource": "currencies", "order": 9, "enabled": true, "applicableTo": ["payments", "invoices"], "columnName": "currency"},
        {"id": "comment", "label": "Комментарий", "type": "text", "order": 10, "enabled": true, "applicableTo": ["payments"], "columnName": "comment"},
        {"id": "tags", "label": "Теги", "type": "tags", "dataSource": "tags", "order": 11, "enabled": true, "applicableTo": ["payments", "invoices"], "columnName": "tags"}
    ],
    "enabled": true
}'::jsonb)
ON CONFLICT (module_id, setting_key) DO UPDATE SET
    value = EXCLUDED.value,
    updated_at = CURRENT_TIMESTAMP;

-- Contracts
INSERT INTO module_settings (module_id, setting_key, value) VALUES
('contracts', 'bulk_edit_fields', '{
    "fields": [
        {"id": "status", "label": "Статус", "type": "select", "dataSource": "statuses", "dataSourceModule": "contracts", "order": 1, "enabled": true, "columnName": "status"},
        {"id": "type", "label": "Тип договора", "type": "select", "dataSource": "contractTypes", "order": 2, "enabled": true, "columnName": "type"},
        {"id": "manager", "label": "Менеджер", "type": "combobox", "dataSource": "users", "order": 3, "enabled": true, "columnName": "manager"},
        {"id": "contractorId", "label": "Контрагент", "type": "combobox", "dataSource": "contractors", "order": 4, "enabled": true, "columnName": "contractor_id"},
        {"id": "amount", "label": "Сумма", "type": "number", "order": 5, "enabled": true, "columnName": "amount"},
        {"id": "startDate", "label": "Дата начала", "type": "date", "order": 6, "enabled": true, "columnName": "start_date"},
        {"id": "endDate", "label": "Дата окончания", "type": "date", "order": 7, "enabled": true, "columnName": "end_date"},
        {"id": "tags", "label": "Теги", "type": "tags", "dataSource": "tags", "order": 8, "enabled": true, "columnName": "tags"}
    ],
    "enabled": true
}'::jsonb)
ON CONFLICT (module_id, setting_key) DO UPDATE SET
    value = EXCLUDED.value,
    updated_at = CURRENT_TIMESTAMP;
