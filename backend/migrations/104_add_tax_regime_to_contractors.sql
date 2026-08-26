-- Migration 104: Add tax_regime_id to contractors
-- Description: Link contractors to tax regimes for automatic VAT calculation

ALTER TABLE contractors 
ADD COLUMN IF NOT EXISTS tax_regime_id INTEGER REFERENCES finance_tax_regimes(id) ON DELETE SET NULL;

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_contractors_tax_regime ON contractors(tax_regime_id);

-- Comment
COMMENT ON COLUMN contractors.tax_regime_id IS 'Ссылка на режим налогообложения для авторасчета НДС';
