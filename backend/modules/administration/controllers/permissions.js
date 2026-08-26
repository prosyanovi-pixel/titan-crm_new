/**
 * Контроллер разрешений
 */

const roleService = require('../services/roleService');
const { asyncHandler } = require('../../../utils/errorHandler');
const { sendSuccess } = require('../../../utils/responseHelpers');

/**
 * Получить все разрешения
 * @route GET /api/administration/permissions
 */
async function getAll(req, res) {
  const permissions = await roleService.getAllPermissions();
  sendSuccess(res, permissions);
}

module.exports = {
  getAll: asyncHandler(getAll)
};
