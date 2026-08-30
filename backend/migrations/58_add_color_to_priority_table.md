# Migration 58: Add Color Column to Priority Table

## Description
Add a color column to the priority reference table to support custom priority colors.
This allows administrators to customize priority colors via Settings UI.

## SQL Statements

### Add Color Column to Priority Table
```sql
ALTER TABLE priority ADD COLUMN color VARCHAR(7);

-- Set default colors for existing priorities
UPDATE priority SET color = '#EF4444' WHERE id = 'High';
UPDATE priority SET color = '#F59E0B' WHERE id = 'Medium';
UPDATE priority SET color = '#3B82F6' WHERE id = 'Low';
```

<!-- Rollback-секция удалена: extractSQLFromMarkdown выполняет ВСЕ SQL-блоки,
     поэтому DROP COLUMN здесь удалял добавленную колонку. -->

## Notes
- The color column stores hex color values (e.g., '#EF4444' for red)
- Default colors match the existing hardcoded values in the frontend
- After this migration, priority colors can be customized via Settings UI
- The color is shared across all modules (projects, tasks, contractors, etc.)

## Related Files
- `backend/routes/referencesHelpers.js` — needs update to use color from DB
- `frontend/src/components/ui/status-system/PriorityBadge.tsx` — uses color from API
