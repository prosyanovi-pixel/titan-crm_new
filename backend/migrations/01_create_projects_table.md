# Mоigration 01: Create Projects Table

## Description
Create the projects table to store project information.

## SQL Statement
```sql
CREATE TABLE projects (
    id INTEGER PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    client VARCHAR(255),
    manager VARCHAR(255),
    status VARCHAR(50),
    stage VARCHAR(50),
    priority VARCHAR(50),
    budget DECIMAL(15,2),
    budgetused DECIMAL(15,2),
    deadline DATE,
    taskscount INTEGER,
    completedtasks INTEGER,
    parent_id INTEGER REFERENCES projects(id)
);
```

## Columns
- `id` - Unique identifier for the project
- `name` - Project name
- `client` - Client name
- `manager` - Project manager name
- `status` - Project status (active, paused, completed, etc.)
- `stage` - Current project stage
- `priority` - Project priority level
- `budget` - Total project budget
- `budgetused` - Amount of budget used
- `deadline` - Project deadline
- `taskscount` - Total number of tasks
- `completedtasks` - Number of completed tasks
- `parent_id` - Foreign key referencing projects.id to create parent-child relationship for sub-projects