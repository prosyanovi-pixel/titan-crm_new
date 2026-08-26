# Migration 26: Create Roles and Permissions Tables

## Description
Create roles and permissions tables to support user management system.

## SQL Statements

```sql
-- Create roles table
CREATE TABLE IF NOT EXISTS roles (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    permissions JSONB DEFAULT '[]',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create permissions table
CREATE TABLE IF NOT EXISTS permissions (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    category VARCHAR(50),
    resource VARCHAR(50),
    action VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default roles
INSERT INTO roles (id, name, description, permissions) VALUES
('admin', 'Администратор', 'Полный доступ ко всем функциям', '["users.*", "roles.*", "permissions.*", "settings.*"]'),
('manager', 'Менеджер', 'Управление проектами и клиентами', '["projects.*", "tasks.*", "contractors.*", "documents.*"]'),
('user', 'Пользователь', 'Базовый доступ к функциям', '["projects.read", "tasks.read", "contractors.read"]')
ON CONFLICT (id) DO NOTHING;

-- Insert default permissions
INSERT INTO permissions (id, name, description, category, resource, action) VALUES
('users.read', 'Просмотр пользователей', 'Просмотр списка пользователей', 'users', 'users', 'read'),
('users.write', 'Управление пользователями', 'Создание и редактирование пользователей', 'users', 'users', 'write'),
('users.delete', 'Удаление пользователей', 'Удаление пользователей', 'users', 'users', 'delete'),
('roles.read', 'Просмотр ролей', 'Просмотр списка ролей', 'roles', 'roles', 'read'),
('roles.write', 'Управление ролями', 'Создание и редактирование ролей', 'roles', 'roles', 'write'),
('permissions.read', 'Просмотр прав доступа', 'Просмотр прав доступа', 'permissions', 'permissions', 'read'),
('permissions.write', 'Управление правами доступа', 'Создание и редактирование прав доступа', 'permissions', 'permissions', 'write'),
('settings.read', 'Просмотр настроек', 'Просмотр системных настроек', 'settings', 'settings', 'read'),
('settings.write', 'Управление настройками', 'Изменение системных настроек', 'settings', 'settings', 'write')
ON CONFLICT (id) DO NOTHING;

-- Update existing users to use role IDs
UPDATE users SET role = 'user' WHERE role IS NULL OR role = '';
UPDATE users SET role = 'admin' WHERE name LIKE '%Админ%' OR name LIKE '%Admin%';
UPDATE users SET role = 'manager' WHERE name LIKE '%Менеджер%' OR name LIKE '%Manager%';
UPDATE users SET role = 'user' WHERE role NOT IN ('admin', 'manager');

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_roles_name ON roles(name);
CREATE INDEX IF NOT EXISTS idx_permissions_category ON permissions(category);
CREATE INDEX IF NOT EXISTS idx_permissions_resource ON permissions(resource);
```
