/**
 * Контроллер для tax regimes в Finance
 */

const { sendSuccess, sendCreated, sendNotFound, sendDeleted, sendValidationError } = require('../../../utils/responseHelpers');
const financeSettingsService = require('../services/financeSettingsService');

/**
 * GET /api/module-settings/finance/tax-regimes
 */
async function getTaxRegimes(req, res) {
  try {
    const regimes = await financeSettingsService.getTaxRegimes();
    sendSuccess(res, regimes);
  } catch (error) {
    console.error('Error in getTaxRegimes:', error);
    sendValidationError(res, error.message || 'Failed to get tax regimes');
  }
}

/**
 * GET /api/module-settings/finance/tax-regimes/:id
 */
async function getTaxRegime(req, res) {
  const { id } = req.params;

  try {
    const regime = await financeSettingsService.getTaxRegimeById(parseInt(id));

    if (!regime) {
      return sendNotFound(res, 'Tax regime not found');
    }

    sendSuccess(res, regime);
  } catch (error) {
    console.error(`Error in getTaxRegime ${id}:`, error);
    sendNotFound(res, 'Tax regime not found');
  }
}

/**
 * POST /api/module-settings/finance/tax-regimes
 */
async function createTaxRegime(req, res) {
  try {
    const regime = await financeSettingsService.createTaxRegime(req.body);
    sendCreated(res, regime);
  } catch (error) {
    console.error('Error in createTaxRegime:', error);
    sendValidationError(res, error.message || 'Failed to create tax regime');
  }
}

/**
 * PUT /api/module-settings/finance/tax-regimes/:id
 */
async function updateTaxRegime(req, res) {
  const { id } = req.params;

  try {
    const regime = await financeSettingsService.updateTaxRegime(parseInt(id), req.body);

    if (!regime) {
      return sendNotFound(res, 'Tax regime not found');
    }

    sendSuccess(res, regime);
  } catch (error) {
    console.error(`Error in updateTaxRegime ${id}:`, error);
    sendValidationError(res, error.message || 'Failed to update tax regime');
  }
}

/**
 * DELETE /api/module-settings/finance/tax-regimes/:id
 */
async function deleteTaxRegime(req, res) {
  const { id } = req.params;

  try {
    const deleted = await financeSettingsService.deleteTaxRegime(parseInt(id));

    if (!deleted) {
      return sendNotFound(res, 'Tax regime not found');
    }

    sendDeleted(res);
  } catch (error) {
    console.error(`Error in deleteTaxRegime ${id}:`, error);
    sendNotFound(res, 'Tax regime not found');
  }
}

/**
 * GET /api/module-settings/finance/tax-regimes/available
 */
async function getAvailableTaxRegimes(req, res) {
  const { legalForm, date, includeRates } = req.query;

  if (!legalForm) {
    return sendValidationError(res, 'Параметр legalForm обязателен');
  }

  try {
    const regimes = await financeSettingsService.getRegimesByLegalForm(
      legalForm,
      date ? new Date(date) : new Date()
    );

    let result = regimes;
    if (includeRates === 'true') {
      const regimesWithRates = await Promise.all(
        regimes.map(async (regime) => {
          const rates = await financeSettingsService.getTaxRates(regime.id);
          return { ...regime, rates };
        })
      );
      result = regimesWithRates;
    }

    sendSuccess(res, result);
  } catch (error) {
    console.error('Error in getAvailableTaxRegimes:', error);
    sendValidationError(res, error.message || 'Failed to get available tax regimes');
  }
}

/**
 * PUT /api/module-settings/finance/tax-regimes/:id/legal-forms
 */
async function updateTaxRegimeLegalForms(req, res) {
  const { id } = req.params;
  const { legalForms } = req.body;

  if (!Array.isArray(legalForms)) {
    return sendValidationError(res, 'legalForms должен быть массивом кодов юридических форм');
  }

  try {
    const regime = await financeSettingsService.updateTaxRegimeLegalForms(
      parseInt(id),
      legalForms
    );

    sendSuccess(res, regime);
  } catch (error) {
    console.error(`Error in updateTaxRegimeLegalForms ${id}:`, error);
    sendValidationError(res, error.message || 'Failed to update legal forms');
  }
}

module.exports = {
  getTaxRegimes,
  getTaxRegime,
  createTaxRegime,
  updateTaxRegime,
  deleteTaxRegime,
  getAvailableTaxRegimes,
  updateTaxRegimeLegalForms,
};
