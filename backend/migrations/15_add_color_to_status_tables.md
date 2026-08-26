# Migration 15: Add Color Column to Status Tables

## Description
Add a color column to all status reference tables to support custom status colors.

## SQL Statements

### Add Color Column to Contractor Status Table
```sql
ALTER TABLE contractor_status ADD COLUMN color VARCHAR(7);
UPDATE contractor_status SET color = '#10B981' WHERE id = 'active';
UPDATE contractor_status SET color = '#F59E0B' WHERE id = 'pending';
UPDATE contractor_status SET color = '#3B82F6' WHERE id = 'vip';
UPDATE contractor_status SET color = '#EF4444' WHERE id = 'paused';
```

### Add Color Column to Project Status Table
```sql
ALTER TABLE project_status ADD COLUMN color VARCHAR(7);
UPDATE project_status SET color = '#10B981' WHERE id = 'active';
UPDATE project_status SET color = '#F59E0B' WHERE id = 'pending';
UPDATE project_status SET color = '#EF4444' WHERE id = 'paused';
UPDATE project_status SET color = '#6B7280' WHERE id = 'finished';
```

### Add Color Column to Task Status Table
```sql
ALTER TABLE task_status ADD COLUMN color VARCHAR(7);
UPDATE task_status SET color = '#F59E0B' WHERE id = 'To Do';
UPDATE task_status SET color = '#10B981' WHERE id = 'In Progress';
UPDATE task_status SET color = '#6B7280' WHERE id = 'Done';
```

### Add Color Column to Lawyer Status Table
```sql
ALTER TABLE lawyer_status ADD COLUMN color VARCHAR(7);
UPDATE lawyer_status SET color = '#10B981' WHERE id = 'active';
UPDATE lawyer_status SET color = '#6B7280' WHERE id = 'vacation';
UPDATE lawyer_status SET color = '#6B7280' WHERE id = 'sick';
UPDATE lawyer_status SET color = '#6B7280' WHERE id = 'fired';
```

### Add Color Column to Case Status Table
```sql
ALTER TABLE case_status ADD COLUMN color VARCHAR(7);
UPDATE case_status SET color = '#10B981' WHERE id = 'in_progress';
UPDATE case_status SET color = '#F59E0B' WHERE id = 'new';
UPDATE case_status SET color = '#F59E0B' WHERE id = 'preparation';
UPDATE case_status SET color = '#F59E0B' WHERE id = 'filing';
UPDATE case_status SET color = '#F59E0B' WHERE id = 'hearing';
UPDATE case_status SET color = '#F59E0B' WHERE id = 'decision';
UPDATE case_status SET color = '#F59E0B' WHERE id = 'enforcement';
UPDATE case_status SET color = '#6B7280' WHERE id = 'done';
UPDATE case_status SET color = '#6B7280' WHERE id = 'archive';
UPDATE case_status SET color = '#EF4444' WHERE id = 'paused';
UPDATE case_status SET color = '#F59E0B' WHERE id = 'claim_draft';
UPDATE case_status SET color = '#F59E0B' WHERE id = 'claim_sent';
UPDATE case_status SET color = '#F59E0B' WHERE id = 'claim_negotiation';
```

## Notes
- The color column stores hex color values (e.g., '#FF0000' for red)
- Default colors are assigned to existing statuses to maintain visual consistency
- The color column is nullable to allow for statuses without custom colors