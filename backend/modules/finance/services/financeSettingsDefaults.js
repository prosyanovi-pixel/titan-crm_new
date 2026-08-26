/**
 * Настройки Finance по умолчанию
 */

const db = require('../../../db');
const { transformDefaultsSettings } = require('./financeSettingsTransforms');

async function getDefaultsSettings() {
  const { rows } = await db.query('SELECT * FROM finance_defaults_settings WHERE id = 1');
  if (rows.length === 0) return null;
  return transformDefaultsSettings(rows[0]);
}

async function updateDefaultsSettings(data) {
  const existing = await getDefaultsSettings();

  if (!existing) {
    const query = `
      INSERT INTO finance_defaults_settings (
        id, default_tax_regime_id, default_allocation_method_id, default_currency,
        default_payment_terms_days, auto_calculate_vat, auto_calculate_taxes,
        auto_allocate_overhead, overhead_allocation_frequency, min_profitability_threshold,
        max_budget_variance, enable_budget_alerts, enable_overdue_alerts
      ) VALUES (1, $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *
    `;

    const values = [
      data.defaultTaxRegimeId || null,
      data.defaultAllocationMethodId || null,
      data.defaultCurrency || 'RUB',
      data.defaultPaymentTermsDays || 30,
      data.autoCalculateVat !== false,
      data.autoCalculateTaxes !== false,
      data.autoAllocateOverhead || false,
      data.overheadAllocationFrequency || 'monthly',
      data.minProfitabilityThreshold || 10.00,
      data.maxBudgetVariance || 20.00,
      data.enableBudgetAlerts !== false,
      data.enableOverdueAlerts !== false,
    ];

    const { rows } = await db.query(query, values);
    return transformDefaultsSettings(rows[0]);
  }

  const fields = [];
  const values = [];
  let paramIndex = 1;

  const updatableFields = [
    { key: 'defaultTaxRegimeId', db: 'default_tax_regime_id' },
    { key: 'defaultAllocationMethodId', db: 'default_allocation_method_id' },
    { key: 'defaultCurrency', db: 'default_currency' },
    { key: 'defaultPaymentTermsDays', db: 'default_payment_terms_days' },
    { key: 'autoCalculateVat', db: 'auto_calculate_vat' },
    { key: 'autoCalculateTaxes', db: 'auto_calculate_taxes' },
    { key: 'autoAllocateOverhead', db: 'auto_allocate_overhead' },
    { key: 'overheadAllocationFrequency', db: 'overhead_allocation_frequency' },
    { key: 'minProfitabilityThreshold', db: 'min_profitability_threshold' },
    { key: 'maxBudgetVariance', db: 'max_budget_variance' },
    { key: 'enableBudgetAlerts', db: 'enable_budget_alerts' },
    { key: 'enableOverdueAlerts', db: 'enable_overdue_alerts' },
  ];

  for (const { key, db: dbField } of updatableFields) {
    if (data[key] !== undefined) {
      fields.push(`${dbField} = $${paramIndex}`);
      values.push(data[key]);
      paramIndex++;
    }
  }

  if (fields.length === 0) {
    throw new Error('No fields to update');
  }

  const query = `
    UPDATE finance_defaults_settings
    SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
    WHERE id = 1
    RETURNING *
  `;

  const { rows } = await db.query(query, values);
  return transformDefaultsSettings(rows[0]);
}

module.exports = {
  getDefaultsSettings,
  updateDefaultsSettings,
};
