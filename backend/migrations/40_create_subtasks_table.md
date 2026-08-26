# Migration 40: Create Subtasks Table

## Description
Create the subtasks table to store subtask information for tasks.

## SQL Statement
```sql
CREATE TABLE IF NOT EXISTS subtasks (
    id VARCHAR(50) PRIMARY KEY,
    task_id VARCHAR(50),
    title VARCHAR(255),
    completed BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
);
```

## Columns
- `id` - Unique identifier for the subtask
- `task_id` - Reference to the parent task
- `title` - Subtask title/description
- `completed` - Whether the subtask is completed

## Notes
- This table was defined in migration 04 but never actually created
- Adding CASCADE DELETE so subtasks are automatically deleted when parent task is deleted