-- Soft delete для таблиц (по одной с проверкой существования таблицы —
-- contracts/products/marketing_campaigns создаются позже, в миграциях 301+)
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'projects') THEN
        ALTER TABLE projects ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE NULL;
        CREATE INDEX IF NOT EXISTS idx_projects_deleted_at ON projects(deleted_at);
    END IF;
END $$;

DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'tasks') THEN
        ALTER TABLE tasks ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE NULL;
        CREATE INDEX IF NOT EXISTS idx_tasks_deleted_at ON tasks(deleted_at);
    END IF;
END $$;

DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'contractors') THEN
        ALTER TABLE contractors ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE NULL;
        CREATE INDEX IF NOT EXISTS idx_contractors_deleted_at ON contractors(deleted_at);
    END IF;
END $$;

DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'contracts') THEN
        ALTER TABLE contracts ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE NULL;
        CREATE INDEX IF NOT EXISTS idx_contracts_deleted_at ON contracts(deleted_at);
    END IF;
END $$;

DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'products') THEN
        ALTER TABLE products ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE NULL;
        CREATE INDEX IF NOT EXISTS idx_products_deleted_at ON products(deleted_at);
    END IF;
END $$;

DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'marketing_campaigns') THEN
        ALTER TABLE marketing_campaigns ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE NULL;
        CREATE INDEX IF NOT EXISTS idx_marketing_campaigns_deleted_at ON marketing_campaigns(deleted_at);
    END IF;
END $$;