# Migration 46: Add Missing Case Tables

## Description
Create missing case_third_parties and case_events tables for legal cases.

## SQL Statement

### Create case_third_parties table
```sql
CREATE TABLE IF NOT EXISTS case_third_parties (
    id VARCHAR(50) PRIMARY KEY,
    case_id VARCHAR(50) NOT NULL,
    name VARCHAR(255),
    role VARCHAR(100),
    FOREIGN KEY (case_id) REFERENCES legal_cases(id) ON DELETE CASCADE
);
```

### Create case_events table  
```sql
CREATE TABLE IF NOT EXISTS case_events (
    id VARCHAR(50) PRIMARY KEY,
    case_id VARCHAR(50) NOT NULL,
    date VARCHAR(50),
    type VARCHAR(50),
    title VARCHAR(255),
    description TEXT,
    author VARCHAR(255),
    FOREIGN KEY (case_id) REFERENCES legal_cases(id) ON DELETE CASCADE
);
```

<!-- ВАЖНО: секция Rollback удалена — extractSQLFromMarkdown выполняет ВСЕ SQL-блоки,
     и DROP TABLE из rollback уничтожал только что созданные таблицы. -->
