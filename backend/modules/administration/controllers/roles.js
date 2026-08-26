/**
 * Контроллер ролей
 */

const roleService = require('../services/roleService');
const { asyncHandler } = require('../../../utils/errorHandler');
const { sendSuccess, sendCreated, sendNotFound, sendDeleted, sendValidationError } = require('../../../utils/responseHelpers');

/**
 * Получить все роли
 * @route GET /api/administration/roles
 */
async function getAll(req, res) {
  const roles = await roleService.getAllRoles();
  sendSuccess(res, roles);
}

/**
 * Создать роль
 * @route POST /api/administration/roles
 */
async function create(req, res) {
  const role = await roleService.createRole(req.body);
  sendCreated(res, role);
}

/**
 * Обновить роль
 * @route PUT /api/administration/roles/:id
 */
async function update(req, res) {
  const role = await roleService.updateRole(req.params.id, req.body);
  if (!role) return sendNotFound(res, 'Role not found');
  sendSuccess(res, role);
}

/**
 * Удалить роль
 * @route DELETE /api/administration/roles/:id
 */
async function remove(req, res) {
  try {
    await roleService.deleteRole(req.params.id);
    sendDeleted(res);
  } catch (err) {
    sendValidationError(res, err.message);
  }
}

module.exports = {
  getAll: asyncHandler(getAll),
  create: asyncHandler(create),
  update: asyncHandler(update),
  remove: asyncHandler(remove)
};
