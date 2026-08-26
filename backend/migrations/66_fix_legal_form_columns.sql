-- Migration 66: Fix legal_form and legal_entity_type column sizes
-- Increase VARCHAR size to accommodate all values

ALTER TABLE contractors 
  ALTER COLUMN legal_form TYPE VARCHAR(50),
  ALTER COLUMN legal_entity_type TYPE VARCHAR(50);

-- Update any existing long values to short codes
UPDATE contractors SET legal_form = 'ooo' WHERE legal_form IN ('ПАО', 'ООО', 'АО', 'НАО', 'ЗАО', 'ОАО');
UPDATE contractors SET legal_form = 'ip' WHERE legal_form IN ('ИП', 'Индивидуальный предприниматель');
UPDATE contractors SET legal_form = 'self' WHERE legal_form IN ('Самозанятый', 'НПД');
UPDATE contractors SET legal_form = 'foreign' WHERE legal_form IN ('Иностранное', 'Foreign');

-- Set legal_entity_type based on legal_form
UPDATE contractors SET legal_entity_type = 'individual' WHERE legal_form = 'ip';
UPDATE contractors SET legal_entity_type = 'legal' WHERE legal_form IN ('ooo', 'foreign');
