# Migration 09: Create Reference Tables

## Description
Create reference/lookup tables for dropdown values used throughout the application.

## SQL Statements

### Project Status Reference Table
```sql
CREATE TABLE project_status (
    id VARCHAR(20) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    displayorder INTEGER
);

INSERT INTO project_status (id, name, displayorder) VALUES
('active', 'Активный', 1),
('pending', 'В ожидании', 2),
('paused', 'Приостановлен', 3),
('finished', 'Завершен', 4);
```

### Project Stage Reference Table
```sql
CREATE TABLE project_stage (
    id VARCHAR(20) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    displayorder INTEGER
);

INSERT INTO project_stage (id, name, displayorder) VALUES
('todo', 'К выполнению', 1),
('in_progress', 'В работе', 2),
('review', 'На проверке', 3),
('done', 'Выполнено', 4);
```

### Priority Reference Table
```sql
CREATE TABLE priority (
    id VARCHAR(20) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    displayorder INTEGER
);

INSERT INTO priority (id, name, displayorder) VALUES
('High', 'Высокий', 1),
('Medium', 'Средний', 2),
('Low', 'Низкий', 3);
```

### Contractor Status Reference Table
```sql
CREATE TABLE contractor_status (
    id VARCHAR(20) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    displayorder INTEGER
);

INSERT INTO contractor_status (id, name, displayorder) VALUES
('active', 'Активный', 1),
('pending', 'В ожидании', 2),
('vip', 'VIP', 3),
('paused', 'Приостановлен', 4);
```

### Legal Form Reference Table
```sql
CREATE TABLE legal_form (
    id VARCHAR(20) PRIMARY KEY,
    name VARCHAR(100) NOT NULL
);

INSERT INTO legal_form (id, name) VALUES
('ooo', 'ООО'),
('ip', 'ИП'),
('self', 'Частное лицо'),
('foreign', 'Иностранная организация');
```

### Contractor Type Reference Table
```sql
CREATE TABLE contractor_type (
    id VARCHAR(20) PRIMARY KEY,
    name VARCHAR(100) NOT NULL
);

INSERT INTO contractor_type (id, name) VALUES
('client', 'Клиент'),
('partner', 'Партнер'),
('supplier', 'Поставщик'),
('our', 'Наша организация');
```

### Task Status Reference Table
```sql
CREATE TABLE task_status (
    id VARCHAR(20) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    displayorder INTEGER
);

INSERT INTO task_status (id, name, displayorder) VALUES
('To Do', 'К выполнению', 1),
('In Progress', 'В работе', 2),
('Done', 'Выполнено', 3);
```

### Lawyer Status Reference Table
```sql
CREATE TABLE lawyer_status (
    id VARCHAR(20) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    displayorder INTEGER
);

INSERT INTO lawyer_status (id, name, displayorder) VALUES
('active', 'Активный', 1),
('vacation', 'В отпуске', 2),
('sick', 'На больничном', 3),
('fired', 'Уволен', 4);
```

### Specialization Reference Table
```sql
CREATE TABLE specialization (
    id VARCHAR(20) PRIMARY KEY,
    name VARCHAR(100) NOT NULL
);

INSERT INTO specialization (id, name) VALUES
('corporate', 'Корпоративное право'),
('criminal', 'Уголовное право'),
('family', 'Семейное право'),
('arbitration', 'Арбитраж'),
('civil', 'Гражданское право');
```

### Case Status Reference Table
```sql
CREATE TABLE case_status (
    id VARCHAR(20) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    displayorder INTEGER
);

INSERT INTO case_status (id, name, displayorder) VALUES
('new', 'Новое', 1),
('preparation', 'Подготовка', 2),
('filing', 'Подача', 3),
('hearing', 'Рассмотрение', 4),
('decision', 'Решение', 5),
('enforcement', 'Исполнение', 6),
('done', 'Завершено', 7),
('archive', 'В архиве', 8),
('in_progress', 'В работе', 9),
('paused', 'Приостановлено', 10),
('claim_draft', 'Черновик иска', 11),
('claim_sent', 'Иск отправлен', 12),
('claim_negotiation', 'Переговоры по иску', 13);
```

### Currency Reference Table
```sql
CREATE TABLE currency (
    id VARCHAR(3) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    symbol VARCHAR(10)
);

INSERT INTO currency (id, name, symbol) VALUES
('RUB', 'Российский рубль', '₽'),
('USD', 'Доллар США', '$'),
('EUR', 'Евро', '€'),
('CNY', 'Китайский юань', '¥'),
('GBP', 'Фунт стерлингов', '£');
```

### Case Type Reference Table
```sql
CREATE TABLE case_type (
    id VARCHAR(20) PRIMARY KEY,
    name VARCHAR(100) NOT NULL
);

INSERT INTO case_type (id, name) VALUES
('claim', 'Претензионная работа'),
('court', 'Судебная работа');
```

### Event Type Reference Table
```sql
CREATE TABLE event_type (
    id VARCHAR(20) PRIMARY KEY,
    name VARCHAR(100) NOT NULL
);

INSERT INTO event_type (id, name) VALUES
('court', 'Судебное событие'),
('document', 'Документ'),
('finance', 'Финансовое событие'),
('communication', 'Коммуникация');
```

### Mail Label Reference Table
```sql
CREATE TABLE mail_label (
    id VARCHAR(20) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    color VARCHAR(20)
);

INSERT INTO mail_label (id, name, color) VALUES
('work', 'Работа', 'blue'),
('personal', 'Личное', 'green'),
('important', 'Важное', 'red');
```

## Notes
- All reference tables use the ID as both the primary key and the value used in the application
- Displayorder is used for sorting dropdown lists in a logical order (column name: displayorder)
- Names are stored in Russian for direct display in the UI
- Colors are included for labels to maintain visual consistency
