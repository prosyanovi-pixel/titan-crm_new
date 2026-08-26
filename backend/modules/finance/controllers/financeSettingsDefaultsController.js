/**
 * Контроллер для настроек Finance по умолчанию
 */

const { sendSuccess, sendNotFound, sendValidationError } = require('../../../utils/responseHelpers');
const financeSettingsService = require('../services/financeSettingsDefaults');

/**
 * GET /api/module-settings/finance/defaults
 */
async function getDefaultsSettings(req, res) {
  try {
    const settings = await financeSettingsService.getDefaultsSettings();

    if (!settings) {
      return sendNotFound(res, 'Default settings not found');
    }

    sendSuccess(res, settings);
  } catch (error) {
    console.error('Error in getDefaultsSettings:', error);
    sendValidationError(res, error.message || 'Failed to get default settings');
  }
}

/**
 * PUT /api/module-settings/finance/defaults
 */
async function updateDefaultsSettings(req, res) {
  try {
    const settings = await financeSettingsService.updateDefaultsSettings(req.body);
    sendSuccess(res, settings);
  } catch (error) {
    console.error('Error in updateDefaultsSettings:', error);
    sendValidationError(res, error.message || 'Failed to update default settings');
  }
}

module.exports = {
  getDefaultsSettings,
  updateDefaultsSettings,
};
