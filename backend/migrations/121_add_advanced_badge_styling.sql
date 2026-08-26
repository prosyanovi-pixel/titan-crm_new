-- Migration 121: Add Advanced Badge Styling Columns
-- Add columns for icons, glassmorphism, gradients, and animations to all status-related tables.

-- 1. defined_tags
ALTER TABLE defined_tags ADD COLUMN IF NOT EXISTS icon VARCHAR(50);
ALTER TABLE defined_tags ADD COLUMN IF NOT EXISTS is_glass BOOLEAN DEFAULT false;
ALTER TABLE defined_tags ADD COLUMN IF NOT EXISTS is_gradient BOOLEAN DEFAULT false;
ALTER TABLE defined_tags ADD COLUMN IF NOT EXISTS secondary_color VARCHAR(7);
ALTER TABLE defined_tags ADD COLUMN IF NOT EXISTS is_animated BOOLEAN DEFAULT false;

-- 2. priority
ALTER TABLE priority ADD COLUMN IF NOT EXISTS icon VARCHAR(50);
ALTER TABLE priority ADD COLUMN IF NOT EXISTS is_glass BOOLEAN DEFAULT false;
ALTER TABLE priority ADD COLUMN IF NOT EXISTS is_gradient BOOLEAN DEFAULT false;
ALTER TABLE priority ADD COLUMN IF NOT EXISTS secondary_color VARCHAR(7);
ALTER TABLE priority ADD COLUMN IF NOT EXISTS is_animated BOOLEAN DEFAULT false;

-- 3. case_outcome
ALTER TABLE case_outcome ADD COLUMN IF NOT EXISTS icon VARCHAR(50);
ALTER TABLE case_outcome ADD COLUMN IF NOT EXISTS is_glass BOOLEAN DEFAULT false;
ALTER TABLE case_outcome ADD COLUMN IF NOT EXISTS is_gradient BOOLEAN DEFAULT false;
ALTER TABLE case_outcome ADD COLUMN IF NOT EXISTS secondary_color VARCHAR(7);
ALTER TABLE case_outcome ADD COLUMN IF NOT EXISTS is_animated BOOLEAN DEFAULT false;

-- 4. contractor_status
ALTER TABLE contractor_status ADD COLUMN IF NOT EXISTS icon VARCHAR(50);
ALTER TABLE contractor_status ADD COLUMN IF NOT EXISTS is_glass BOOLEAN DEFAULT false;
ALTER TABLE contractor_status ADD COLUMN IF NOT EXISTS is_gradient BOOLEAN DEFAULT false;
ALTER TABLE contractor_status ADD COLUMN IF NOT EXISTS secondary_color VARCHAR(7);
ALTER TABLE contractor_status ADD COLUMN IF NOT EXISTS is_animated BOOLEAN DEFAULT false;

-- 5. project_status
ALTER TABLE project_status ADD COLUMN IF NOT EXISTS icon VARCHAR(50);
ALTER TABLE project_status ADD COLUMN IF NOT EXISTS is_glass BOOLEAN DEFAULT false;
ALTER TABLE project_status ADD COLUMN IF NOT EXISTS is_gradient BOOLEAN DEFAULT false;
ALTER TABLE project_status ADD COLUMN IF NOT EXISTS secondary_color VARCHAR(7);
ALTER TABLE project_status ADD COLUMN IF NOT EXISTS is_animated BOOLEAN DEFAULT false;

-- 6. task_status
ALTER TABLE task_status ADD COLUMN IF NOT EXISTS icon VARCHAR(50);
ALTER TABLE task_status ADD COLUMN IF NOT EXISTS is_glass BOOLEAN DEFAULT false;
ALTER TABLE task_status ADD COLUMN IF NOT EXISTS is_gradient BOOLEAN DEFAULT false;
ALTER TABLE task_status ADD COLUMN IF NOT EXISTS secondary_color VARCHAR(7);
ALTER TABLE task_status ADD COLUMN IF NOT EXISTS is_animated BOOLEAN DEFAULT false;

-- 7. lawyer_status
ALTER TABLE lawyer_status ADD COLUMN IF NOT EXISTS icon VARCHAR(50);
ALTER TABLE lawyer_status ADD COLUMN IF NOT EXISTS is_glass BOOLEAN DEFAULT false;
ALTER TABLE lawyer_status ADD COLUMN IF NOT EXISTS is_gradient BOOLEAN DEFAULT false;
ALTER TABLE lawyer_status ADD COLUMN IF NOT EXISTS secondary_color VARCHAR(7);
ALTER TABLE lawyer_status ADD COLUMN IF NOT EXISTS is_animated BOOLEAN DEFAULT false;

-- 8. case_status
ALTER TABLE case_status ADD COLUMN IF NOT EXISTS icon VARCHAR(50);
ALTER TABLE case_status ADD COLUMN IF NOT EXISTS is_glass BOOLEAN DEFAULT false;
ALTER TABLE case_status ADD COLUMN IF NOT EXISTS is_gradient BOOLEAN DEFAULT false;
ALTER TABLE case_status ADD COLUMN IF NOT EXISTS secondary_color VARCHAR(7);
ALTER TABLE case_status ADD COLUMN IF NOT EXISTS is_animated BOOLEAN DEFAULT false;

-- 9. finance_invoice_status
ALTER TABLE finance_invoice_status ADD COLUMN IF NOT EXISTS icon VARCHAR(50);
ALTER TABLE finance_invoice_status ADD COLUMN IF NOT EXISTS is_glass BOOLEAN DEFAULT false;
ALTER TABLE finance_invoice_status ADD COLUMN IF NOT EXISTS is_gradient BOOLEAN DEFAULT false;
ALTER TABLE finance_invoice_status ADD COLUMN IF NOT EXISTS secondary_color VARCHAR(7);
ALTER TABLE finance_invoice_status ADD COLUMN IF NOT EXISTS is_animated BOOLEAN DEFAULT false;
