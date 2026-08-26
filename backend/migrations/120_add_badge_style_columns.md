# Migration 120: Add Badge Style Columns

## Description
Add columns for badge styling (variant, size, shape) to all status, tag, priority, and outcome tables.
This enables per‑item customization of badge appearance in the UI.

## SQL Statements

```sql
-- 1. defined_tags (tags) – add size and shape (variant already exists)
ALTER TABLE defined_tags ADD COLUMN IF NOT EXISTS size VARCHAR(10) DEFAULT 'md';
ALTER TABLE defined_tags ADD COLUMN IF NOT EXISTS shape VARCHAR(20) DEFAULT 'rounded';

-- 2. priority – add variant, size, shape
ALTER TABLE priority ADD COLUMN IF NOT EXISTS variant VARCHAR(20);
ALTER TABLE priority ADD COLUMN IF NOT EXISTS size VARCHAR(10) DEFAULT 'md';
ALTER TABLE priority ADD COLUMN IF NOT EXISTS shape VARCHAR(20) DEFAULT 'rounded';

-- 3. case_outcome – add variant, size, shape
ALTER TABLE case_outcome ADD COLUMN IF NOT EXISTS variant VARCHAR(20);
ALTER TABLE case_outcome ADD COLUMN IF NOT EXISTS size VARCHAR(10) DEFAULT 'md';
ALTER TABLE case_outcome ADD COLUMN IF NOT EXISTS shape VARCHAR(20) DEFAULT 'rounded';

-- 4. contractor_status – add variant, size, shape
ALTER TABLE contractor_status ADD COLUMN IF NOT EXISTS variant VARCHAR(20);
ALTER TABLE contractor_status ADD COLUMN IF NOT EXISTS size VARCHAR(10) DEFAULT 'md';
ALTER TABLE contractor_status ADD COLUMN IF NOT EXISTS shape VARCHAR(20) DEFAULT 'rounded';

-- 5. project_status – add variant, size, shape
ALTER TABLE project_status ADD COLUMN IF NOT EXISTS variant VARCHAR(20);
ALTER TABLE project_status ADD COLUMN IF NOT EXISTS size VARCHAR(10) DEFAULT 'md';
ALTER TABLE project_status ADD COLUMN IF NOT EXISTS shape VARCHAR(20) DEFAULT 'rounded';

-- 6. task_status – add variant, size, shape
ALTER TABLE task_status ADD COLUMN IF NOT EXISTS variant VARCHAR(20);
ALTER TABLE task_status ADD COLUMN IF NOT EXISTS size VARCHAR(10) DEFAULT 'md';
ALTER TABLE task_status ADD COLUMN IF NOT EXISTS shape VARCHAR(20) DEFAULT 'rounded';

-- 7. lawyer_status – add variant, size, shape
ALTER TABLE lawyer_status ADD COLUMN IF NOT EXISTS variant VARCHAR(20);
ALTER TABLE lawyer_status ADD COLUMN IF NOT EXISTS size VARCHAR(10) DEFAULT 'md';
ALTER TABLE lawyer_status ADD COLUMN IF NOT EXISTS shape VARCHAR(20) DEFAULT 'rounded';

-- 8. case_status – add variant, size, shape
ALTER TABLE case_status ADD COLUMN IF NOT EXISTS variant VARCHAR(20);
ALTER TABLE case_status ADD COLUMN IF NOT EXISTS size VARCHAR(10) DEFAULT 'md';
ALTER TABLE case_status ADD COLUMN IF NOT EXISTS shape VARCHAR(20) DEFAULT 'rounded';

-- 9. finance_invoice_status – add variant, size, shape
ALTER TABLE finance_invoice_status ADD COLUMN IF NOT EXISTS variant VARCHAR(20);
ALTER TABLE finance_invoice_status ADD COLUMN IF NOT EXISTS size VARCHAR(10) DEFAULT 'md';
ALTER TABLE finance_invoice_status ADD COLUMN IF NOT EXISTS shape VARCHAR(20) DEFAULT 'rounded';

-- Set default values for existing rows (optional)
UPDATE defined_tags SET size = 'md' WHERE size IS NULL;
UPDATE defined_tags SET shape = 'rounded' WHERE shape IS NULL;

UPDATE priority SET variant = 'solid' WHERE variant IS NULL;
UPDATE priority SET size = 'md' WHERE size IS NULL;
UPDATE priority SET shape = 'rounded' WHERE shape IS NULL;

UPDATE case_outcome SET variant = 'solid' WHERE variant IS NULL;
UPDATE case_outcome SET size = 'md' WHERE size IS NULL;
UPDATE case_outcome SET shape = 'rounded' WHERE shape IS NULL;

UPDATE contractor_status SET variant = 'solid' WHERE variant IS NULL;
UPDATE contractor_status SET size = 'md' WHERE size IS NULL;
UPDATE contractor_status SET shape = 'rounded' WHERE shape IS NULL;

UPDATE project_status SET variant = 'solid' WHERE variant IS NULL;
UPDATE project_status SET size = 'md' WHERE size IS NULL;
UPDATE project_status SET shape = 'rounded' WHERE shape IS NULL;

UPDATE task_status SET variant = 'solid' WHERE variant IS NULL;
UPDATE task_status SET size = 'md' WHERE size IS NULL;
UPDATE task_status SET shape = 'rounded' WHERE shape IS NULL;

UPDATE lawyer_status SET variant = 'solid' WHERE variant IS NULL;
UPDATE lawyer_status SET size = 'md' WHERE size IS NULL;
UPDATE lawyer_status SET shape = 'rounded' WHERE shape IS NULL;

UPDATE case_status SET variant = 'solid' WHERE variant IS NULL;
UPDATE case_status SET size = 'md' WHERE size IS NULL;
UPDATE case_status SET shape = 'rounded' WHERE shape IS NULL;

UPDATE finance_invoice_status SET variant = 'solid' WHERE variant IS NULL;
UPDATE finance_invoice_status SET size = 'md' WHERE size IS NULL;
UPDATE finance_invoice_status SET shape = 'rounded' WHERE shape IS NULL;
```

## Notes
- The `variant` column accepts values: 'solid', 'soft', 'outline', 'ghost'.
- The `size` column accepts values: 'xs', 'sm', 'md', 'lg'.
- The `shape` column accepts values: 'square', 'rounded', 'pill', 'left-pill', 'right-pill', 'top-pill', 'bottom-pill', 'bubble', 'stadium'.
- Default values are set to match the current visual appearance (solid variant, medium size, rounded shape).
- Existing rows are updated with safe defaults; new rows will use the column defaults.