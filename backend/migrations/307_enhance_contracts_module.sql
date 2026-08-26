-- Migration: Enhance contracts table with contractor, type, amount, currency, and payment status columns
-- Version: 307

-- Add columns to contracts table if they do not exist
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS contractor_id INTEGER REFERENCES contractors(id) ON DELETE SET NULL;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS type VARCHAR(50) DEFAULT 'service';
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS amount NUMERIC(15, 2);
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS currency VARCHAR(10) DEFAULT 'RUB';
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS payment_status VARCHAR(50) DEFAULT 'unpaid';

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_contracts_contractor_id ON contracts(contractor_id);
CREATE INDEX IF NOT EXISTS idx_contracts_type ON contracts(type);
CREATE INDEX IF NOT EXISTS idx_contracts_payment_status ON contracts(payment_status);

-- Seed quick actions for contracts
INSERT INTO quick_actions (id, name, icon, action, module, displayorder, is_active) VALUES
('contracts_send_for_approval', 'Отправить на одобрение', 'CheckSquare', 'send_for_approval', 'contracts', 1, TRUE),
('contracts_create_invoice', 'Создать счёт', 'FilePlus', 'create_invoice', 'contracts', 2, TRUE)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    icon = EXCLUDED.icon,
    action = EXCLUDED.action,
    module = EXCLUDED.module,
    displayorder = EXCLUDED.displayorder,
    is_active = EXCLUDED.is_active,
    updated_at = CURRENT_TIMESTAMP;
