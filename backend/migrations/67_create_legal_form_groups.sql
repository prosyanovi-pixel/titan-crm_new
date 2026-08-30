-- Migration 67: Create legal form groups for organizing legal forms into tabs
-- Allows full management of legal forms and their grouping

-- Create groups table
CREATE TABLE IF NOT EXISTS legal_form_groups (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    name_ru VARCHAR(100),  -- Russian translation key
    display_order INTEGER DEFAULT 0,
    color VARCHAR(7) DEFAULT '#3B82F6',
    show_as_tab BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add group_id to legal_form (if not exists)
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'legal_form' AND column_name = 'group_id'
    ) THEN
        ALTER TABLE legal_form ADD COLUMN group_id VARCHAR(50) REFERENCES legal_form_groups(id);
    END IF;
END $$;

-- Rename group_name to group_id for consistency
DO $$ BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'legal_form' AND column_name = 'group_name'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'legal_form' AND column_name = 'group_id'
    ) THEN
        ALTER TABLE legal_form RENAME COLUMN group_name TO group_id;
    END IF;
END $$;

-- Add color to legal_form (if not exists)
-- Необходимо для миграции 67b (вставка организационно-правовых форм с цветами)
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'legal_form' AND column_name = 'color'
    ) THEN
        ALTER TABLE legal_form ADD COLUMN color VARCHAR(20);
    END IF;
END $$;

-- Insert default groups
INSERT INTO legal_form_groups (id, name, name_ru, display_order, show_as_tab) VALUES
    ('legal', 'Юридические лица', 'contractors.tabs.legal', 1, TRUE),
    ('individual', 'Индивидуальные предприниматели', 'contractors.tabs.ip', 2, TRUE),
    ('private', 'Физические лица', 'contractors.tabs.private', 3, TRUE),
    ('foreign', 'Иностранные организации', 'contractors.tabs.foreign', 4, TRUE)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    name_ru = EXCLUDED.name_ru,
    display_order = EXCLUDED.display_order,
    show_as_tab = EXCLUDED.show_as_tab;

-- Update existing legal forms with group_id
UPDATE legal_form SET group_id = 'legal' WHERE id IN ('ooo', 'pao', 'ao', 'nano', 'zao', 'oao', 'ano', 'np', 'gup', 'mup');
UPDATE legal_form SET group_id = 'individual' WHERE id = 'ip';
UPDATE legal_form SET group_id = 'private' WHERE id IN ('self', 'private');
UPDATE legal_form SET group_id = 'foreign' WHERE id = 'foreign';

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_legal_form_group ON legal_form(group_id);

COMMENT ON TABLE legal_form_groups IS 'Группы правовых форм для организации вкладок';
COMMENT ON COLUMN legal_form_groups.show_as_tab IS 'Показывать ли группу как вкладку для фильтрации';
