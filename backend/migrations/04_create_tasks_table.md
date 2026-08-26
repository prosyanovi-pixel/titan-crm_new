# Migration 04: Create Tasks Table

## Description
Create the tasks table to store task information.

## SQL Statement
```sql
CREATE TABLE tasks (
    id VARCHAR(50) PRIMARY KEY,
    identifier VARCHAR(50),
    title VARCHAR(255) NOT NULL,
    project VARCHAR(255),
    assignee VARCHAR(255),
    assignee_initials VARCHAR(10),
    priority VARCHAR(50),
    status VARCHAR(50),
    due_date VARCHAR(50)
);
```

## Columns
- `id` - Unique identifier for the task
- `identifier` - Task identifier (e.g., TSK-324)
- `title` - Task title/description
- `project` - Associated project name
- `assignee` - Person assigned to the task
- `assignee_initials` - Initials of the assignee
- `priority` - Task priority (High, Medium, Low)
- `status` - Task status (To Do, In Progress, Done)
- `due_date` - Due date for the task

## Additional Tables
For storing subtasks, an additional table will be needed:

### Subtasks Table
```sql
CREATE TABLE subtasks (
    id VARCHAR(50) PRIMARY KEY,
    taskId VARCHAR(50),
    title VARCHAR(255),
    completed BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (taskId) REFERENCES tasks(id)
);