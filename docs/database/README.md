# Схема базы данных TITAN CRM

## Обзор
Эта документация описывает структуру и схему базы данных системы TITAN CRM.

## Архитектура базы данных

### Основные таблицы

#### Пользователи (users)
- id: UUID (primary key)
- email: VARCHAR(255) UNIQUE
- password_hash: TEXT
- first_name: VARCHAR(100)
- last_name: VARCHAR(100)
- phone: VARCHAR(20)
- role_id: UUID (foreign key to roles)
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
- is_active: BOOLEAN

#### Роли (roles)
- id: UUID (primary key)
- name: VARCHAR(100) UNIQUE
- description: TEXT
- permissions: JSONB
- created_at: TIMESTAMP

#### Проекты (projects)
- id: UUID (primary key)
- name: VARCHAR(255)
- description: TEXT
- status: VARCHAR(50)
- start_date: DATE
- end_date: DATE
- budget: DECIMAL
- manager_id: UUID (foreign key to users)
- created_at: TIMESTAMP
- updated_at: TIMESTAMP

#### Договоры (contracts)
- id: UUID (primary key)
- name: VARCHAR(255)
- description: TEXT
- status: VARCHAR(50)
- start_date: DATE
- end_date: DATE
- value: DECIMAL
- client_id: UUID (foreign key to users)
- created_at: TIMESTAMP
- updated_at: TIMESTAMP

#### Документы (documents)
- id: UUID (primary key)
- name: VARCHAR(255)
- description: TEXT
- file_path: TEXT
- mime_type: VARCHAR(100)
- size: BIGINT
- owner_id: UUID (foreign key to users)
- created_at: TIMESTAMP
- updated_at: TIMESTAMP

#### Юридические дела (legal_cases)
- id: UUID (primary key)
- name: VARCHAR(255)
- description: TEXT
- status: VARCHAR(50)
- case_number: VARCHAR(100)
- client_id: UUID (foreign key to users)
- created_at: TIMESTAMP
- updated_at: TIMESTAMP

#### Уведомления (notifications)
- id: UUID (primary key)
- title: VARCHAR(255)
- message: TEXT
- type: VARCHAR(50)
- is_read: BOOLEAN
- user_id: UUID (foreign key to users)
- created_at: TIMESTAMP

### Связи между таблицами
- Users → Roles (many-to-one)
- Projects → Users (many-to-one via manager_id)
- Contracts → Users (many-to-one via client_id)
- Documents → Users (many-to-one via owner_id)
- Legal Cases → Users (many-to-one via client_id)
- Notifications → Users (many-to-one)

## Миграции
Все изменения в схеме базы данных реализуются через миграции:

### Пример миграции
```sql
-- Migration: Create users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    phone VARCHAR(20),
    role_id UUID REFERENCES roles(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
Индексы
Для оптимизации производительности создаются индексы:

Индексы на полях, используемых в WHERE и JOIN
Индексы на полях сортировки
Уникальные индексы на полях с уникальными значениями
Безопасность
Все пароли хэшируются с использованием bcrypt
Используется параметризованные запросы для предотвращения SQL инъекций
Ограничение прав доступа к таблицам