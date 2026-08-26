ALTER TABLE projects ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE NULL;
CREATE INDEX IF NOT EXISTS idx_projects_deleted_at ON projects(deleted_at);

ALTER TABLE tasks ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE NULL;
CREATE INDEX IF NOT EXISTS idx_tasks_deleted_at ON tasks(deleted_at);

ALTER TABLE contractors ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE NULL;
CREATE INDEX IF NOT EXISTS idx_contractors_deleted_at ON contractors(deleted_at);

ALTER TABLE contracts ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE NULL;
CREATE INDEX IF NOT EXISTS idx_contracts_deleted_at ON contracts(deleted_at);

ALTER TABLE products ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE NULL;
CREATE INDEX IF NOT EXISTS idx_products_deleted_at ON products(deleted_at);

ALTER TABLE marketing_campaigns ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE NULL;
CREATE INDEX IF NOT EXISTS idx_marketing_campaigns_deleted_at ON marketing_campaigns(deleted_at);
