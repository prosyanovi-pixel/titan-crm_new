/**
 * Контроллер для tax rates в Finance
 */

const { sendSuccess, sendCreated, sendNotFound, sendDeleted, sendValidationError } = require('../../../utils/responseHelpers');
const financeSettingsService = require('../services/financeSettingsService');
const db = require('../../../db');

/**
 * GET /api/module-settings/finance/tax-rates
 */
async function getTaxRates(req, res) {
  const { taxRegimeId } = req.query;

  try {
    const rates = await financeSettingsService.getTaxRates(taxRegimeId ? parseInt(taxRegimeId) : null);
    sendSuccess(res, rates);
  } catch (error) {
    console.error('Error in getTaxRates:', error);
    sendValidationError(res, error.message || 'Failed to get tax rates');
  }
}

/**
 * GET /api/module-settings/finance/tax-rates/:id
 */
async function getTaxRate(req, res) {
  const { id } = req.params;

  try {
    const rate = await financeSettingsService.getTaxRateById(parseInt(id));

    if (!rate) {
      return sendNotFound(res, 'Tax rate not found');
    }

    sendSuccess(res, rate);
  } catch (error) {
    console.error(`Error in getTaxRate ${id}:`, error);
    sendNotFound(res, 'Tax rate not found');
  }
}

/**
 * POST /api/module-settings/finance/tax-rates
 */
async function createTaxRate(req, res) {
  try {
    const rate = await financeSettingsService.createTaxRate(req.body);
    sendCreated(res, rate);
  } catch (error) {
    console.error('Error in createTaxRate:', error);
    sendValidationError(res, error.message || 'Failed to create tax rate');
  }
}

/**
 * PUT /api/module-settings/finance/tax-rates/:id
 */
async function updateTaxRate(req, res) {
  const { id } = req.params;

  try {
    const rate = await financeSettingsService.updateTaxRate(parseInt(id), req.body);

    if (!rate) {
      return sendNotFound(res, 'Tax rate not found');
    }

    sendSuccess(res, rate);
  } catch (error) {
    console.error(`Error in updateTaxRate ${id}:`, error);
    sendValidationError(res, error.message || 'Failed to update tax rate');
  }
}

/**
 * DELETE /api/module-settings/finance/tax-rates/:id
 */
async function deleteTaxRate(req, res) {
  const { id } = req.params;

  try {
    const deleted = await financeSettingsService.deleteTaxRate(parseInt(id));

    if (!deleted) {
      return sendNotFound(res, 'Tax rate not found');
    }

    sendDeleted(res);
  } catch (error) {
    console.error(`Error in deleteTaxRate ${id}:`, error);
    sendNotFound(res, 'Tax rate not found');
  }
}

/**
 * GET /api/module-settings/finance/tax-rates/history
 */
async function getTaxRatesHistory(req, res) {
  const { taxType, regimeId } = req.query;

  try {
    let query = 'SELECT * FROM finance_tax_rates WHERE 1=1';
    const params = [];
    let paramIndex = 1;

    if (taxType) {
      query += ` AND tax_type = $${paramIndex}`;
      params.push(taxType);
      paramIndex++;
    }

    if (regimeId) {
      query += ` AND tax_regime_id = $${paramIndex}`;
      params.push(parseInt(regimeId));
      paramIndex++;
    }

    query += ' ORDER BY effective_from DESC, created_at DESC';

    const { rows } = await db.query(query, params);

    const grouped = {};
    rows.forEach((row) => {
      const type = row.tax_type;
      if (!grouped[type]) grouped[type] = [];
      grouped[type].push({
        id: row.id,
        rate: row.rate,
        isFixed: row.is_fixed,
        fixedAmount: row.fixed_amount,
        effectiveFrom: row.effective_from,
        effectiveTo: row.effective_to,
        isActive: row.is_active,
        createdAt: row.created_at,
      });
    });

    sendSuccess(res, {
      taxType,
      regimeId,
      history: grouped,
    });
  } catch (error) {
    console.error('Error in getTaxRatesHistory:', error);
    sendValidationError(res, error.message || 'Failed to get tax rates history');
  }
}

module.exports = {
  getTaxRates,
  getTaxRate,
  createTaxRate,
  updateTaxRate,
  deleteTaxRate,
  getTaxRatesHistory,
};
