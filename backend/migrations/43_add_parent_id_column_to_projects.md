# Migration 43: Add parent_id column to projects table

## Description
Add parent_id column to support project hierarchy (sub-projects).

## SQL Statement
```sql
ALTER TABLE projects ADD COLUMN IF NOT EXISTS parent_id INTEGER REFERENCES projects(id);
```

## Columns
- `parent_id` - Foreign key referencing projects.id to create parent-child relationship for sub-projects
