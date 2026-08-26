/**
 * Контроллер для allocation methods в Finance
 */

const { sendSuccess, sendCreated, sendNotFound, sendDeleted, sendValidationError } = require('../../../utils/responseHelpers');
const financeSettingsService = require('../services/financeSettingsService');

/**
 * GET /api/module-settings/finance/allocation-methods
 */
async function getAllocationMethods(req, res) {
  try {
    const methods = await financeSettingsService.getAllocationMethods();
    sendSuccess(res, methods);
  } catch (error) {
    console.error('Error in getAllocationMethods:', error);
    sendValidationError(res, error.message || 'Failed to get allocation methods');
  }
}

/**
 * POST /api/module-settings/finance/allocation-methods
 */
async function createAllocationMethod(req, res) {
  try {
    const method = await financeSettingsService.createAllocationMethod(req.body);
    sendCreated(res, method);
  } catch (error) {
    console.error('Error in createAllocationMethod:', error);
    sendValidationError(res, error.message || 'Failed to create allocation method');
  }
}

/**
 * DELETE /api/module-settings/finance/allocation-methods/:id
 */
async function deleteAllocationMethod(req, res) {
  const { id } = req.params;

  try {
    const deleted = await financeSettingsService.deleteAllocationMethod(parseInt(id));

    if (!deleted) {
      return sendNotFound(res, 'Allocation method not found');
    }

    sendDeleted(res);
  } catch (error) {
    console.error(`Error in deleteAllocationMethod ${id}:`, error);
    sendNotFound(res, 'Allocation method not found');
  }
}

module.exports = {
  getAllocationMethods,
  createAllocationMethod,
  deleteAllocationMethod,
};
