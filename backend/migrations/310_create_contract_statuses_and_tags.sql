-- Migration 310: Create contract status and contract payment status tables, and seed initial values.

-- 1. Create contract_status table
CREATE TABLE IF NOT EXISTS contract_status (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    color VARCHAR(7) DEFAULT '#6B7280',
    displayorder INTEGER,
    variant VARCHAR(20) DEFAULT 'solid',
    size VARCHAR(10) DEFAULT 'md',
    shape VARCHAR(20) DEFAULT 'rounded',
    icon VARCHAR(50),
    is_glass BOOLEAN DEFAULT false,
    is_gradient BOOLEAN DEFAULT false,
    secondary_color VARCHAR(7),
    is_animated BOOLEAN DEFAULT false
);

-- 2. Create contract_payment_status table
CREATE TABLE IF NOT EXISTS contract_payment_status (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    color VARCHAR(7) DEFAULT '#6B7280',
    displayorder INTEGER,
    variant VARCHAR(20) DEFAULT 'solid',
    size VARCHAR(10) DEFAULT 'md',
    shape VARCHAR(20) DEFAULT 'rounded',
    icon VARCHAR(50),
    is_glass BOOLEAN DEFAULT false,
    is_gradient BOOLEAN DEFAULT false,
    secondary_color VARCHAR(7),
    is_animated BOOLEAN DEFAULT false
);

-- 3. Seed contract statuses
INSERT INTO contract_status (id, name, color, displayorder, variant, shape) VALUES
('draft', 'Черновик', '#6B7280', 1, 'soft', 'rounded'),
('pending_approval', 'На одобрении', '#F59E0B', 2, 'soft', 'rounded'),
('approved', 'Одобрен', '#10B981', 3, 'soft', 'rounded'),
('rejected', 'Отклонен', '#EF4444', 4, 'soft', 'rounded'),
('archived', 'В архиве', '#6B7280', 5, 'soft', 'rounded')
ON CONFLICT (id) DO NOTHING;

-- 4. Seed contract payment statuses
INSERT INTO contract_payment_status (id, name, color, displayorder, variant, shape) VALUES
('unpaid', 'Не оплачен', '#EF4444', 1, 'soft', 'rounded'),
('partially_paid', 'Частично оплачен', '#3B82F6', 2, 'soft', 'rounded'),
('paid', 'Оплачен', '#10B981', 3, 'soft', 'rounded'),
('overdue', 'Просрочен', '#B91C1C', 4, 'soft', 'rounded')
ON CONFLICT (id) DO NOTHING;

-- 5. Seed default tags for contracts
INSERT INTO defined_tags (id, name, color, module, variant, shape, displayorder) VALUES
('contract_tag_service', 'Услуги', '#3B82F6', 'contracts', 'soft', 'pill', 1),
('contract_tag_supply', 'Поставка', '#10B981', 'contracts', 'soft', 'pill', 2),
('contract_tag_urgent', 'Срочный', '#EF4444', 'contracts', 'soft', 'pill', 3)
ON CONFLICT (id) DO NOTHING;
