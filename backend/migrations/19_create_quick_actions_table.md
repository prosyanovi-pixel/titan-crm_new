# Migration 11: Create Quick Actions Table

## Description
Create a table to store quick actions configuration that can be used across different modules in the application.

## SQL Statements

### Quick Actions Table
```sql
CREATE TABLE quick_actions (
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
CREATE INDEX idx_quick_actions_module ON quick_actions(module);
CREATE INDEX idx_quick_actions_action ON quick_actions(action);
```

### Insert Default Quick Actions
```sql
INSERT INTO quick_actions (id, name, icon, action, module, displayorder, is_active) VALUES
('1', 'Создать задачу', 'Plus', 'create_task', 'tasks', 1, TRUE),
('2', 'Отправить письмо', 'Mail', 'send_email', 'contractors', 1, TRUE),
('3', 'Добавить заметку', 'StickyNote', 'add_note', 'contractors', 2, TRUE),
('4', 'Создать договор', 'FileSignature', 'create_contract', 'contractors', 3, TRUE),
('5', 'Назначить встречу', 'Calendar', 'schedule_meeting', 'projects', 1, TRUE),
('6', 'Экспорт отчёта', 'Download', 'export_report', 'projects', 2, TRUE),
('7', 'Назначить юриста', 'User', 'assign_lawyer', 'cases', 1, TRUE),
('8', 'Отправить в суд', 'Send', 'send_to_court', 'cases', 2, TRUE),
('9', 'Добавить документ', 'FileText', 'add_document', 'cases', 3, TRUE);
```

## API Endpoints
- GET /api/quick-actions - Get all quick actions
- GET /api/quick-actions/:module - Get quick actions for a specific module
- POST /api/quick-actions - Create a new quick action
- PUT /api/quick-actions/:id - Update a quick action
- DELETE /api/quick-actions/:id - Delete a quick action

## Notes
- The `module` field corresponds to the application modules (tasks, contractors, projects, etc.)
- The `action` field defines what action should be triggered
- The `icon` field stores the icon name to display
- Displayorder determines the order of actions in the UI
- The `is_active` field allows for soft deletion and enabling/disabling actions