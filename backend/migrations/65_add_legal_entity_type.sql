-- Migration 65: Add legal_entity_type column to contractors
-- Stores the legal entity type (ИП, ЮЛ, Физлицо, Иностранная организация)

ALTER TABLE contractors 
ADD COLUMN IF NOT EXISTS legal_entity_type VARCHAR(50);

-- Update existing contractors based on legal_form
UPDATE contractors SET legal_entity_type = 'individual' WHERE legal_form = 'ip';
UPDATE contractors SET legal_entity_type = 'legal' WHERE legal_form IN ('ooo', 'foreign');
UPDATE contractors SET legal_entity_type = 'legal' WHERE legal_form IS NULL AND inn IS NOT NULL AND LENGTH(inn) = 10;
UPDATE contractors SET legal_entity_type = 'individual' WHERE legal_form IS NULL AND inn IS NOT NULL AND LENGTH(inn) = 12;

COMMENT ON COLUMN contractors.legal_entity_type IS 'Правовая сущность: individual (ИП), legal (ЮЛ), private (Физлицо), foreign (Иностранная организация)';
