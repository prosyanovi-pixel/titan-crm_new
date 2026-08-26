
# Migration 14: Create Modules and Defined Tags

## Description
Create tables to store application modules and tag definitions, replacing hardcoded frontend data.

## SQL Statement
```sql
CREATE TABLE modules (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    icon VARCHAR(50) NOT NULL,
    display_order INTEGER DEFAULT 0
);

CREATE TABLE defined_tags (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    color VARCHAR(20) NOT NULL,
    module VARCHAR(50) NOT NULL,
    FOREIGN KEY (module) REFERENCES modules(id) ON DELETE CASCADE
);
```
