
# Migration 15: Seed Migrated Data

## Description
Move data from `settings-data.ts` and `mock-data.ts` into the database.

## SQL Statements

### Seed Modules
```sql
INSERT INTO modules (id, name, icon, display_order) VALUES
('contractors', 'Контрагенты', 'Users', 1),
('projects', 'Проекты', 'FolderKanban', 2),
('tasks', 'Задачи', 'CheckSquare', 3),
('documents', 'Документы', 'FileText', 4),
('contracts', 'Договоры', 'FileSignature', 5),
('mail', 'Почта', 'Mail', 6),
('lawyers', 'Юристы', 'Scale', 7),
('cases', 'Дела', 'Gavel', 8)
ON CONFLICT (id) DO NOTHING;
```

### Seed Defined Tags
```sql
INSERT INTO defined_tags (id, name, color, module) VALUES
('1', 'IT', '#3B82F6', 'contractors'),
('2', 'Ритейл', '#10B981', 'contractors'),
('3', 'Производство', '#F59E0B', 'contractors'),
('4', 'Финансы', '#8B5CF6', 'contractors'),
('5', 'Срочный', '#EF4444', 'projects'),
('6', 'Долгосрочный', '#6366F1', 'projects'),
('7', 'Важная', '#EF4444', 'tasks'),
('8', 'Баг', '#DC2626', 'tasks'),
('9', 'Улучшение', '#22C55E', 'tasks')
ON CONFLICT (id) DO NOTHING;
```

### Seed Users (Ensure MOCK_USERS exist)
```sql
-- Updating existing users or inserting missing ones to match mock data
INSERT INTO users (id, name, initials, role, status, avatar) VALUES
('4', 'Елена Дизайн', 'ЕД', 'Designer', 'active', 'ЕД'),
('5', 'Анна Тех', 'АТ', 'Engineer', 'active', 'АТ'),
('6', 'Мария Иванова', 'МИ', 'Analyst', 'active', 'МИ')
ON CONFLICT (id) DO NOTHING;

-- Update roles for existing users to match mock data
UPDATE users SET role = 'Admin' WHERE id = '2';
UPDATE users SET role = 'Manager' WHERE id = '1';
UPDATE users SET role = 'Developer' WHERE id = '3';
```
