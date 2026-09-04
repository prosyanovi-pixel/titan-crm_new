-- ================================================================
-- TITAN CRM — Полный seed данных
-- ================================================================
-- Использование:
--   cd backend
--   npm run seed:all
--
-- Или через psql:
--   PGPASSWORD="password" psql -h localhost -U user -d database -f seeds/seed_all.sql
-- ================================================================

-- ================================================================
-- 1. СПРАВОЧНИКИ И СТАТУСЫ
-- ================================================================

-- Приоритеты (priority)
INSERT INTO priority (id, name, displayorder, color) VALUES
    ('High', 'Высокий', 1, '#EF4444'),
    ('Medium', 'Средний', 2, '#F59E0B'),
    ('Low', 'Низкий', 3, '#3B82F6')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, displayorder = EXCLUDED.displayorder, color = EXCLUDED.color;

-- Статусы проектов (project_status)
INSERT INTO project_status (id, name, displayorder, color) VALUES
    ('active', 'Активный', 1, '#10B981'),
    ('pending', 'В ожидании', 2, '#F59E0B'),
    ('paused', 'Приостановлен', 3, '#EF4444'),
    ('finished', 'Завершен', 4, '#6B7280')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, displayorder = EXCLUDED.displayorder, color = EXCLUDED.color;

-- Этапы проектов (project_stage)
INSERT INTO project_stage (id, name, displayorder) VALUES
    ('todo', 'К выполнению', 1),
    ('in_progress', 'В работе', 2),
    ('review', 'На проверке', 3),
    ('done', 'Выполнено', 4)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, displayorder = EXCLUDED.displayorder;

-- Статусы контрагентов (contractor_status)
INSERT INTO contractor_status (id, name, displayorder, color) VALUES
    ('active', 'Активный', 1, '#10B981'),
    ('pending', 'В ожидании', 2, '#F59E0B'),
    ('vip', 'VIP', 3, '#3B82F6'),
    ('paused', 'Приостановлен', 4, '#EF4444')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, displayorder = EXCLUDED.displayorder, color = EXCLUDED.color;

-- Статусы задач (task_status)
INSERT INTO task_status (id, name, displayorder, color) VALUES
    ('To Do', 'К выполнению', 1, '#F59E0B'),
    ('In Progress', 'В работе', 2, '#10B981'),
    ('Done', 'Выполнено', 3, '#6B7280')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, displayorder = EXCLUDED.displayorder, color = EXCLUDED.color;

-- Статусы юристов (lawyer_status)
INSERT INTO lawyer_status (id, name, displayorder, color) VALUES
    ('active', 'Активный', 1, '#10B981'),
    ('vacation', 'В отпуске', 2, '#6B7280'),
    ('sick', 'На больничном', 3, '#6B7280'),
    ('fired', 'Уволен', 4, '#6B7280')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, displayorder = EXCLUDED.displayorder, color = EXCLUDED.color;

-- Статусы дел (case_status)
INSERT INTO case_status (id, name, displayorder, color) VALUES
    ('new', 'Новое', 1, '#F59E0B'),
    ('preparation', 'Подготовка', 2, '#F59E0B'),
    ('filing', 'Подача', 3, '#F59E0B'),
    ('hearing', 'Рассмотрение', 4, '#F59E0B'),
    ('decision', 'Решение', 5, '#F59E0B'),
    ('enforcement', 'Исполнение', 6, '#F59E0B'),
    ('done', 'Завершено', 7, '#6B7280'),
    ('archive', 'В архиве', 8, '#6B7280'),
    ('in_progress', 'В работе', 9, '#10B981'),
    ('paused', 'Приостановлено', 10, '#EF4444'),
    ('claim_draft', 'Черновик иска', 11, '#F59E0B'),
    ('claim_sent', 'Иск отправлен', 12, '#F59E0B'),
    ('claim_negotiation', 'Переговоры по иску', 13, '#F59E0B')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, displayorder = EXCLUDED.displayorder, color = EXCLUDED.color;

-- Результаты дел (case_outcome)
INSERT INTO case_outcome (id, name, display_order, color, description) VALUES
    ('won', 'Выиграно', 1, '#10B981', 'Дело выиграно полностью'),
    ('won_partial', 'Выиграно частично', 2, '#F59E0B', 'Дело выиграно частично'),
    ('lost', 'Проиграно', 3, '#EF4444', 'Дело проиграно')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, display_order = EXCLUDED.display_order, color = EXCLUDED.color, description = EXCLUDED.description;

-- Типы дел (case_type)
INSERT INTO case_type (id, name) VALUES
    ('claim', 'Претензионная работа'),
    ('court', 'Судебная работа')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

-- Специализации (specialization)
INSERT INTO specialization (id, name) VALUES
    ('corporate', 'Корпоративное право'),
    ('criminal', 'Уголовное право'),
    ('family', 'Семейное право'),
    ('arbitration', 'Арбитраж'),
    ('civil', 'Гражданское право')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

-- ================================================================
-- 2. ПРАВОВЫЕ ФОРМЫ
-- ================================================================

-- Группы правовых форм (legal_form_groups)
INSERT INTO legal_form_groups (id, name, name_ru, display_order, show_as_tab, color) VALUES
    ('legal', 'Юридические лица', 'contractors.tabs.legal', 1, true, '#3B82F6'),
    ('individual', 'Индивидуальные предприниматели', 'contractors.tabs.ip', 2, true, '#10B981'),
    ('private', 'Физические лица', 'contractors.tabs.private', 3, true, '#F59E0B'),
    ('foreign', 'Иностранные организации', 'contractors.tabs.foreign', 4, true, '#EF4444')
ON CONFLICT (id) DO UPDATE SET 
    name = EXCLUDED.name, 
    name_ru = EXCLUDED.name_ru, 
    display_order = EXCLUDED.display_order,
    show_as_tab = EXCLUDED.show_as_tab,
    color = EXCLUDED.color;

-- Правовые формы (legal_form) - legacy table, skipped as legal_forms is already seeded via migrations
-- INSERT INTO legal_form (id, name, group_id, displayorder, color) VALUES ...


-- Типы контрагентов (contractor_type)
INSERT INTO contractor_type (id, name) VALUES
    ('client', 'Клиент'),
    ('partner', 'Партнер'),
    ('supplier', 'Поставщик'),
    ('our', 'Наша организация')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

-- Типы отношений (relationship_type)
INSERT INTO relationship_type (id, name, color, module, displayorder) VALUES
    ('client', 'Клиент', '#3B82F6', 'contractors', 1),
    ('partner', 'Партнер', '#10B981', 'contractors', 2),
    ('supplier', 'Поставщик', '#F59E0B', 'contractors', 3),
    ('our', 'Наша организация', '#8B5CF6', 'contractors', 4)
ON CONFLICT (id) DO UPDATE SET 
    name = EXCLUDED.name, 
    color = EXCLUDED.color,
    module = EXCLUDED.module,
    displayorder = EXCLUDED.displayorder;

-- ================================================================
-- 3. ФИНАНСЫ
-- ================================================================

-- Валюты (currency)
INSERT INTO currency (id, name, symbol, exchange_rate, is_base) VALUES
    ('RUB', 'Российский рубль', '₽', 1.0, true),
    ('USD', 'Доллар США', '$', 90.0, false),
    ('EUR', 'Евро', '€', 97.0, false),
    ('CNY', 'Китайский юань', '¥', 12.5, false),
    ('GBP', 'Фунт стерлингов', '£', 114.0, false)
ON CONFLICT (id) DO UPDATE SET 
    name = EXCLUDED.name, 
    symbol = EXCLUDED.symbol,
    exchange_rate = EXCLUDED.exchange_rate,
    is_base = EXCLUDED.is_base;

-- Статусы счетов (finance_invoice_status)
INSERT INTO finance_invoice_status (id, name, color, displayorder) VALUES
    ('draft', 'Черновик', '#94A3B8', 10),
    ('sent', 'Отправлен', '#3B82F6', 20),
    ('partial_paid', 'Оплачен частично', '#F59E0B', 30),
    ('paid', 'Оплачен', '#22C55E', 40),
    ('overdue', 'Просрочен', '#EF4444', 50)
ON CONFLICT (id) DO UPDATE SET 
    name = EXCLUDED.name, 
    color = EXCLUDED.color,
    displayorder = EXCLUDED.displayorder;

-- Статьи ДДС (finance_expense_categories)
INSERT INTO finance_expense_categories (id, name, kind) VALUES
    ('inc_clients', 'Поступления от клиентов', 'income'),
    ('inc_other', 'Прочие поступления', 'income'),
    ('exp_salary', 'Зарплата и выплаты', 'expense'),
    ('exp_taxes', 'Налоги и сборы', 'expense'),
    ('exp_rent', 'Аренда', 'expense'),
    ('exp_purchase', 'Закупки / материалы', 'expense'),
    ('exp_marketing', 'Маркетинг и реклама', 'expense'),
    ('exp_other', 'Прочие расходы', 'expense')
ON CONFLICT (id) DO UPDATE SET 
    name = EXCLUDED.name, 
    kind = EXCLUDED.kind;

-- ================================================================
-- 4. ПОЧТА И СОБЫТИЯ
-- ================================================================

-- Метки почты (mail_label)
INSERT INTO mail_label (id, name, color) VALUES
    ('work', 'Работа', 'blue'),
    ('personal', 'Личное', 'green'),
    ('important', 'Важное', 'red')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, color = EXCLUDED.color;

-- Типы событий (event_type)
INSERT INTO event_type (id, name) VALUES
    ('court', 'Судебное событие'),
    ('document', 'Документ'),
    ('finance', 'Финансовое событие'),
    ('communication', 'Коммуникация')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

-- ================================================================
-- 5. МОДУЛИ И ТЕГИ
-- ================================================================

-- Модули системы (modules)
INSERT INTO modules (id, name, icon, displayorder, is_active) VALUES
    ('contractors', 'Контрагенты', 'Users', 1, true),
    ('projects', 'Проекты', 'FolderKanban', 2, true),
    ('tasks', 'Задачи', 'CheckSquare', 3, true),
    ('documents', 'Документы', 'FileText', 4, true),
    ('contracts', 'Договоры', 'FileSignature', 5, true),
    ('mail', 'Почта', 'Mail', 6, true),
    ('lawyers', 'Юристы', 'Scale', 7, true),
    ('cases', 'Дела', 'Gavel', 8, true),
    ('quotes', 'Коммерческие предложения', 'FileText', 9, true)
ON CONFLICT (id) DO UPDATE SET 
    name = EXCLUDED.name, 
    icon = EXCLUDED.icon,
    displayorder = EXCLUDED.displayorder,
    is_active = EXCLUDED.is_active;

-- Предопределенные теги (defined_tags)
INSERT INTO defined_tags (id, name, color, module) VALUES
    -- Контрагенты
    (1, 'IT', '#3B82F6', 'contractors'),
    (2, 'Ритейл', '#10B981', 'contractors'),
    (3, 'Производство', '#F59E0B', 'contractors'),
    (4, 'Финансы', '#8B5CF6', 'contractors'),
    -- Проекты
    (5, 'Срочный', '#EF4444', 'projects'),
    (6, 'Долгосрочный', '#6366F1', 'projects'),
    -- Задачи
    (7, 'Важная', '#EF4444', 'tasks'),
    (8, 'Баг', '#DC2626', 'tasks'),
    (9, 'Улучшение', '#22C55E', 'tasks')
ON CONFLICT (id) DO UPDATE SET 
    name = EXCLUDED.name, 
    color = EXCLUDED.color,
    module = EXCLUDED.module;

-- ================================================================
-- 6. РОЛИ И ПРАВА ДОСТУПА
-- ================================================================

-- Роли (roles)
INSERT INTO roles (id, name, description) VALUES
    ('admin', 'Администратор', 'Полный доступ ко всем функциям системы'),
    ('manager', 'Менеджер', 'Управление проектами, клиентами и задачами'),
    ('lawyer', 'Юрист', 'Работа с юридическими делами и документами'),
    ('accountant', 'Бухгалтер', 'Доступ к финансовым данным и отчётам'),
    ('user', 'Пользователь', 'Базовый доступ к функциям'),
    ('viewer', 'Наблюдатель', 'Только просмотр без возможности изменения')
ON CONFLICT (id) DO UPDATE SET 
    name = EXCLUDED.name, 
    description = EXCLUDED.description;

-- Права доступа (permissions)
INSERT INTO permissions (id, name, category, description) VALUES
    -- dashboard
    ('dashboard.read', 'dashboard.read', 'dashboard', 'Просмотр дашборда'),
    -- profile
    ('profile.read', 'profile.read', 'profile', 'Просмотр профиля'),
    ('profile.write', 'profile.write', 'profile', 'Редактирование профиля'),
    -- users
    ('users.read', 'users.read', 'users', 'Просмотр пользователей'),
    ('users.write', 'users.write', 'users', 'Редактирование пользователей'),
    ('users.delete', 'users.delete', 'users', 'Удаление пользователей'),
    ('users.assign', 'users.assign', 'users', 'Назначение пользователей'),
    -- roles
    ('roles.read', 'roles.read', 'roles', 'Просмотр ролей'),
    ('roles.write', 'roles.write', 'roles', 'Редактирование ролей'),
    ('roles.delete', 'roles.delete', 'roles', 'Удаление ролей'),
    -- permissions
    ('permissions.read', 'permissions.read', 'permissions', 'Просмотр прав'),
    ('permissions.write', 'permissions.write', 'permissions', 'Редактирование прав'),
    ('permissions.delete', 'permissions.delete', 'permissions', 'Удаление прав'),
    -- settings
    ('settings.read', 'settings.read', 'settings', 'Просмотр настроек'),
    ('settings.write', 'settings.write', 'settings', 'Редактирование настроек'),
    -- statuses
    ('statuses.read', 'statuses.read', 'statuses', 'Просмотр статусов'),
    ('statuses.write', 'statuses.write', 'statuses', 'Редактирование статусов'),
    ('statuses.delete', 'statuses.delete', 'statuses', 'Удаление статусов'),
    -- tags
    ('tags.read', 'tags.read', 'tags', 'Просмотр тегов'),
    ('tags.write', 'tags.write', 'tags', 'Редактирование тегов'),
    ('tags.delete', 'tags.delete', 'tags', 'Удаление тегов'),
    -- contractors
    ('contractors.read', 'contractors.read', 'contractors', 'Просмотр контрагентов'),
    ('contractors.write', 'contractors.write', 'contractors', 'Редактирование контрагентов'),
    ('contractors.delete', 'contractors.delete', 'contractors', 'Удаление контрагентов'),
    ('contractors.export', 'contractors.export', 'contractors', 'Экспорт контрагентов'),
    -- projects
    ('projects.read', 'projects.read', 'projects', 'Просмотр проектов'),
    ('projects.write', 'projects.write', 'projects', 'Редактирование проектов'),
    ('projects.delete', 'projects.delete', 'projects', 'Удаление проектов'),
    -- tasks
    ('tasks.read', 'tasks.read', 'tasks', 'Просмотр задач'),
    ('tasks.write', 'tasks.write', 'tasks', 'Редактирование задач'),
    ('tasks.delete', 'tasks.delete', 'tasks', 'Удаление задач'),
    ('tasks.assign', 'tasks.assign', 'tasks', 'Назначение задач'),
    -- documents
    ('documents.read', 'documents.read', 'documents', 'Просмотр документов'),
    ('documents.write', 'documents.write', 'documents', 'Редактирование документов'),
    ('documents.delete', 'documents.delete', 'documents', 'Удаление документов'),
    ('documents.upload', 'documents.upload', 'documents', 'Загрузка документов'),
    ('documents.sign', 'documents.sign', 'documents', 'Подписание документов'),
    ('documents.export', 'documents.export', 'documents', 'Экспорт документов'),
    -- cases
    ('cases.read', 'cases.read', 'cases', 'Просмотр дел'),
    ('cases.write', 'cases.write', 'cases', 'Редактирование дел'),
    ('cases.delete', 'cases.delete', 'cases', 'Удаление дел'),
    ('cases.assign', 'cases.assign', 'cases', 'Назначение дел'),
    -- calendar
    ('calendar.read', 'calendar.read', 'calendar', 'Просмотр календаря'),
    ('calendar.write', 'calendar.write', 'calendar', 'Редактирование календаря'),
    ('calendar.delete', 'calendar.delete', 'calendar', 'Удаление событий'),
    -- mail
    ('mail.read', 'mail.read', 'mail', 'Просмотр почты'),
    ('mail.write', 'mail.write', 'mail', 'Редактирование почты'),
    ('mail.delete', 'mail.delete', 'mail', 'Удаление почты'),
    ('mail.send', 'mail.send', 'mail', 'Отправка почты'),
    -- reports
    ('reports.read', 'reports.read', 'reports', 'Просмотр отчётов'),
    ('reports.write', 'reports.write', 'reports', 'Создание отчётов'),
    ('reports.export', 'reports.export', 'reports', 'Экспорт отчётов'),
    -- lawyers
    ('lawyers.read', 'lawyers.read', 'lawyers', 'Просмотр юристов'),
    ('lawyers.write', 'lawyers.write', 'lawyers', 'Редактирование юристов'),
    ('lawyers.delete', 'lawyers.delete', 'lawyers', 'Удаление юристов'),
    ('lawyers.assign', 'lawyers.assign', 'lawyers', 'Назначение юристов'),
    -- finance
    ('finance.read', 'finance.read', 'finance', 'Просмотр финансов'),
    ('finance.write', 'finance.write', 'finance', 'Редактирование финансов'),
    ('finance.delete', 'finance.delete', 'finance', 'Удаление финансовых записей'),
    ('finance.approve', 'finance.approve', 'finance', 'Утверждение финансов'),
    -- backups
    ('backups.read', 'backups.read', 'backups', 'Просмотр резервных копий'),
    ('backups.write', 'backups.write', 'backups', 'Создание резервных копий'),
    ('backups.delete', 'backups.delete', 'backups', 'Удаление резервных копий'),
    -- quotes
    ('quotes.read', 'quotes.read', 'quotes', 'Просмотр коммерческих предложений'),
    ('quotes.write', 'quotes.write', 'quotes', 'Создание и редактирование коммерческих предложений'),
    ('quotes.delete', 'quotes.delete', 'quotes', 'Удаление коммерческих предложений')
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    category = EXCLUDED.category,
    description = EXCLUDED.description;

-- Назначение прав ролям (permissions для roles)
UPDATE roles SET permissions = '["*"]'::jsonb WHERE id = 'admin';
UPDATE roles SET permissions = '[
    "contractors.*", "projects.*", "tasks.*", "documents.*",
    "calendar.*", "mail.*", "reports.*", "cases.*",
    "lawyers.*", "finance.*", "statuses.*", "tags.*",
    "backups.read", "backups.write", "quotes.*"
]'::jsonb WHERE id = 'manager';
UPDATE roles SET permissions = '[
    "cases.*", "documents.*", "calendar.*", "tasks.read", "tasks.write",
    "lawyers.*", "contractors.read", "projects.read",
    "statuses.*", "tags.*"
]'::jsonb WHERE id = 'lawyer';
UPDATE roles SET permissions = '[
    "finance.*", "reports.*", "contractors.read", "documents.*",
    "projects.read", "cases.read",
    "statuses.read", "tags.read", "backups.read"
]'::jsonb WHERE id = 'accountant';
UPDATE roles SET permissions = '[
    "projects.read", "tasks.read", "contractors.read", "documents.read",
    "calendar.read", "cases.read", "mail.read", "mail.write",
    "dashboard.read", "profile.read", "profile.write",
    "statuses.read", "tags.read", "quotes.read", "quotes.write"
]'::jsonb WHERE id = 'user';
UPDATE roles SET permissions = '[
    "projects.read", "tasks.read", "contractors.read", "documents.read",
    "calendar.read", "cases.read", "reports.read",
    "dashboard.read", "profile.read", "profile.write",
    "statuses.read", "tags.read"
]'::jsonb WHERE id = 'viewer';

-- ================================================================
-- 7. БЫСТРЫЕ ДЕЙСТВИЯ
-- ================================================================

-- Быстрые действия (quick_actions)
-- Контрагенты
INSERT INTO quick_actions (id, name, icon, action, module, displayorder, is_active) VALUES
('contractors_send_email', 'Отправить письмо', 'Mail', 'send_email', 'contractors', 1, TRUE),
('contractors_make_call', 'Позвонить', 'Phone', 'make_call', 'contractors', 2, TRUE),
('contractors_create_task', 'Создать задачу', 'Plus', 'create_task', 'contractors', 3, TRUE),
('contractors_create_claim', 'Создать претензию', 'Gavel', 'create_claim', 'contractors', 4, TRUE),
('contractors_create_project', 'Создать проект', 'FolderKanban', 'create_project', 'contractors', 5, TRUE),
('contractors_create_event', 'Создать событие', 'Calendar', 'create_event', 'contractors', 6, TRUE),
('contractors_create_reminder', 'Создать напоминание', 'Bell', 'create_reminder', 'contractors', 7, TRUE)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name, icon = EXCLUDED.icon, action = EXCLUDED.action,
    displayorder = EXCLUDED.displayorder, is_active = EXCLUDED.is_active, updated_at = CURRENT_TIMESTAMP;

-- Проекты
INSERT INTO quick_actions (id, name, icon, action, module, displayorder, is_active) VALUES
('projects_create_project', 'Создать проект', 'Plus', 'create_project', 'projects', 1, TRUE),
('projects_create_task', 'Создать задачу', 'CheckSquare', 'create_task', 'projects', 2, TRUE),
('projects_assign_manager', 'Назначить менеджера', 'User', 'assign_manager', 'projects', 3, TRUE),
('projects_change_status', 'Изменить статус', 'RefreshCw', 'change_status', 'projects', 4, TRUE)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name, icon = EXCLUDED.icon, action = EXCLUDED.action,
    displayorder = EXCLUDED.displayorder, is_active = EXCLUDED.is_active, updated_at = CURRENT_TIMESTAMP;

-- Задачи
INSERT INTO quick_actions (id, name, icon, action, module, displayorder, is_active) VALUES
('tasks_create_task', 'Создать задачу', 'Plus', 'create_task', 'tasks', 1, TRUE)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name, icon = EXCLUDED.icon, action = EXCLUDED.action,
    displayorder = EXCLUDED.displayorder, is_active = EXCLUDED.is_active, updated_at = CURRENT_TIMESTAMP;

-- Удаление старых действий для предотвращения дублей
DELETE FROM quick_actions WHERE module IN ('lawyers', 'cases');

-- Юристы
INSERT INTO quick_actions (id, name, icon, action, module, displayorder, is_active) VALUES
('lawyers_send_email', 'Отправить письмо', 'Mail', 'send_email', 'lawyers', 1, TRUE),
('lawyers_make_call', 'Позвонить', 'Phone', 'make_call', 'lawyers', 2, TRUE),
('lawyers_create_task', 'Создать задачу', 'Plus', 'create_task', 'lawyers', 3, TRUE),
('lawyers_create_case', 'Создать дело', 'Gavel', 'create_case', 'lawyers', 4, TRUE),
('lawyers_create_event', 'Создать событие', 'Calendar', 'create_event', 'lawyers', 5, TRUE),
('lawyers_create_reminder', 'Создать напоминание', 'Bell', 'create_reminder', 'lawyers', 6, TRUE),
('lawyers_add_note', 'Добавить заметку', 'StickyNote', 'add_note', 'lawyers', 7, TRUE),
('lawyers_archive', 'Архивировать', 'Archive', 'archive', 'lawyers', 8, TRUE);

-- Дела
INSERT INTO quick_actions (id, name, icon, action, module, displayorder, is_active) VALUES
('cases_create_event', 'Создать событие', 'Calendar', 'create_event', 'cases', 1, TRUE),
('cases_create_reminder', 'Создать напоминание', 'Bell', 'create_reminder', 'cases', 2, TRUE),
('cases_create_task', 'Создать задачу', 'Plus', 'create_task', 'cases', 3, TRUE),
('cases_add_document', 'Добавить документ', 'FileText', 'add_document', 'cases', 4, TRUE),
('cases_send_to_court', 'Отправить в суд', 'Building2', 'send_to_court', 'cases', 5, TRUE),
('cases_archive', 'Архивировать', 'Archive', 'archive', 'cases', 6, TRUE);

-- Финансы
INSERT INTO quick_actions (id, name, icon, action, module, displayorder, is_active) VALUES
('finance_create_invoice', 'Создать счёт', 'Plus', 'create_invoice', 'finance', 1, TRUE),
('finance_record_payment', 'Записать платёж', 'DollarSign', 'record_payment', 'finance', 2, TRUE),
('finance_generate_document', 'Сформировать документ', 'FileText', 'generate_document', 'finance', 3, TRUE)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name, icon = EXCLUDED.icon, action = EXCLUDED.action,
    displayorder = EXCLUDED.displayorder, is_active = EXCLUDED.is_active, updated_at = CURRENT_TIMESTAMP;

-- ================================================================
-- 8. НАСТРОЙКИ СИСТЕМЫ
-- ================================================================

-- Основные настройки системы
INSERT INTO system_settings (setting_key, value) VALUES
('email_config', '{"host": "", "port": "587", "secure": false, "user": "", "password": "", "from": "TITAN CRM <no-reply@titan.com>"}'),
('telegram_config', '{"botToken": "", "enabled": false}'),
('cache_config', '{"autoClearEnabled": true, "settingsTTL": 3600, "enrichmentTTL": 86400}'),
('sync_config', '{"backupCron": "0 0 * * *", "enrichmentCron": "0 3 * * *", "moduleSyncCron": "0 1 * * *", "enabled": true}'),
('log_to_db', 'true')
ON CONFLICT (setting_key) DO UPDATE SET value = EXCLUDED.value;

-- ================================================================
-- 9. СУДЫ И СУДЬИ
-- ================================================================

-- Суды (courts)
INSERT INTO courts (id, name, address) VALUES
    ('c1', 'Арбитражный суд г. Москвы', 'ул. Большая Тульская, 17'),
    ('c2', 'Басманный районный суд', 'ул. Каланчевская, 11'),
    ('c3', 'Девятый арбитражный апелляционный суд', 'пр. Соломенной Сторожки, 12')
ON CONFLICT (id) DO UPDATE SET 
    name = EXCLUDED.name, 
    address = EXCLUDED.address;

-- Судьи (judges)
INSERT INTO judges (id, name, court_id) VALUES
    ('j1', 'Иванова А.А.', 'c1'),
    ('j2', 'Петров П.П.', 'c1'),
    ('j3', 'Смирнова С.С.', 'c2'),
    ('j4', 'Кузнецов К.К.', 'c3')
ON CONFLICT (id) DO UPDATE SET 
    name = EXCLUDED.name, 
    court_id = EXCLUDED.court_id;

-- ================================================================
-- 10. HR СТРУКТУРА (будет добавлено отдельно)
-- ================================================================

-- ================================================================
-- ЗАВЕРШЕНИЕ
-- ================================================================

SELECT 'Seed completed successfully!' as status;
-- Seed basic characteristic templates for products module
INSERT INTO module_settings (module_id, setting_key, value, updated_at)
VALUES (
    'products', 
    'characteristicTemplates', 
    '[
      {
        "id": "cnc_metal_x_axis",
        "name": "Х-осевые станки металлообработка с ЧПУ",
        "characteristics": [
          { "section": "Ось Х", "name": "Перемещение", "value": "", "unit": "мм" },
          { "section": "Ось Х", "name": "Разрешение", "value": "", "unit": "мм" },
          { "section": "Ось Х", "name": "Максимальная скорость перемещения", "value": "", "unit": "м/мин" },
          { "section": "Ось Y", "name": "Перемещение", "value": "", "unit": "мм" },
          { "section": "Ось Y", "name": "Разрешение", "value": "", "unit": "мм" },
          { "section": "Ось Y", "name": "Максимальная скорость перемещения", "value": "", "unit": "м/мин" },
          { "section": "Ось Z", "name": "Перемещение", "value": "", "unit": "мм" },
          { "section": "Ось Z", "name": "Разрешение", "value": "", "unit": "мм" },
          { "section": "Ось Z", "name": "Максимальная скорость перемещения", "value": "", "unit": "м/мин" },
          { "section": "Ось А", "name": "Перемещение", "value": "", "unit": "град" },
          { "section": "Ось А", "name": "Разрешение", "value": "", "unit": "град" },
          { "section": "Ось А", "name": "Максимальная скорость перемещения", "value": "", "unit": "об/мин" },
          { "section": "Ось B", "name": "Перемещение", "value": "", "unit": "мм" },
          { "section": "Ось B", "name": "Разрешение", "value": "", "unit": "мм" },
          { "section": "Ось B", "name": "Максимальная скорость перемещения", "value": "", "unit": "об/мин" },
          { "section": "Ось С (ось вращения заготовки)", "name": "Разрешение", "value": "", "unit": "град" },
          { "section": "Ось С (ось вращения заготовки)", "name": "Максимальная скорость вращения", "value": "", "unit": "об/мин" },
          { "section": "Точность", "name": "Допуск диаметра кромки (партия)", "value": "", "unit": "мм" },
          { "section": "Точность", "name": "Допуск на биение", "value": "", "unit": "мм" },
          { "section": "Точность", "name": "Допуск длины кромки", "value": "", "unit": "мм" },
          { "section": "Манипулятор", "name": "Перемещение", "value": "", "unit": "мм" },
          { "section": "Манипулятор", "name": "Максимальная рабочая скорость", "value": "", "unit": "м/мин" },
          { "section": "Шпиндель", "name": "Скорость вращения шпинделя", "value": "", "unit": "об/мин" },
          { "section": "Шпиндель", "name": "Мощность двигателя", "value": "", "unit": "кВт" },
          { "section": "Шпиндель", "name": "Макс. количество шлифовальных кругов", "value": "", "unit": "шт" },
          { "section": "Шпиндель", "name": "Макс. диаметр шлифовального круга", "value": "", "unit": "мм" },
          { "section": "Параметры шлифования", "name": "Тип цанги", "value": "", "unit": "тип" },
          { "section": "Параметры шлифования", "name": "Диаметр инструментального хвостовика", "value": "", "unit": "мм" },
          { "section": "Параметры шлифования", "name": "Шлифуемый диаметр", "value": "", "unit": "мм" },
          { "section": "Параметры шлифования", "name": "Длина заготовки (автоматический/ручной)", "value": "", "unit": "мм" },
          { "section": "Параметры шлифования", "name": "Макс вес заготовки", "value": "", "unit": "грамм" },
          { "section": "Параметры шлифования", "name": "Диаметр режущей кромки инструмента D", "value": "", "unit": "мм" },
          { "section": "Общие параметры", "name": "Электропитание", "value": "", "unit": "" },
          { "section": "Общие параметры", "name": "Мощность", "value": "", "unit": "кВт" },
          { "section": "Общие параметры", "name": "Габариты", "value": "", "unit": "мм" },
          { "section": "Общие параметры", "name": "Вес", "value": "", "unit": "кг" },
          { "section": "Общие параметры", "name": "Давление подачи СОЖ", "value": "", "unit": "МПа" },
          { "section": "Общие параметры", "name": "Давление воздуха", "value": "", "unit": "Бар" }
        ]
      },
      {
        "id": "aggregate_machines",
        "name": "Агрегатные станки",
        "characteristics": [
          { "section": "Основные", "name": "Производительность", "value": "", "unit": "шт/час" },
          { "section": "Основные", "name": "Количество рабочих станций", "value": "", "unit": "шт" },
          { "section": "Основные", "name": "Количество шпинделей", "value": "", "unit": "шт" },
          { "section": "Габариты заготовки", "name": "Максимальный размер (ДхШхВ)", "value": "", "unit": "мм" },
          { "section": "Габариты заготовки", "name": "Максимальный вес", "value": "", "unit": "кг" },
          { "section": "Точность", "name": "Позиционирование", "value": "", "unit": "мм" },
          { "section": "Точность", "name": "Повторяемость", "value": "", "unit": "мм" },
          { "section": "Электропитание", "name": "Напряжение", "value": "380", "unit": "В" },
          { "section": "Электропитание", "name": "Суммарная мощность", "value": "", "unit": "кВт" },
          { "section": "Общие параметры", "name": "Габариты станка", "value": "", "unit": "мм" },
          { "section": "Общие параметры", "name": "Вес станка", "value": "", "unit": "кг" }
        ]
      },
      {
        "id": "tooling_and_accessories",
        "name": "Сопутствующие товары и оснастка",
        "characteristics": [
          { "section": "Общие параметры", "name": "Материал", "value": "", "unit": "" },
          { "section": "Общие параметры", "name": "Покрытие", "value": "", "unit": "" },
          { "section": "Размеры", "name": "Диаметр", "value": "", "unit": "мм" },
          { "section": "Размеры", "name": "Общая длина", "value": "", "unit": "мм" },
          { "section": "Размеры", "name": "Длина рабочей части", "value": "", "unit": "мм" },
          { "section": "Совместимость", "name": "Тип крепления / хвостовика", "value": "", "unit": "" },
          { "section": "Совместимость", "name": "Подходит для станков", "value": "", "unit": "" },
          { "section": "Упаковка", "name": "Количество в упаковке", "value": "", "unit": "шт" },
          { "section": "Упаковка", "name": "Вес брутто", "value": "", "unit": "кг" }
        ]
      }
    ]'::jsonb, 
    CURRENT_TIMESTAMP
)
ON CONFLICT (module_id, setting_key) 
DO NOTHING;
