/**
 * Контроллер отделов
 */

const orgService = require('../services/orgService');
const { asyncHandler } = require('../../../utils/errorHandler');
const { sendSuccess, sendCreated, sendNotFound, sendDeleted, sendValidationError } = require('../../../utils/responseHelpers');

/**
 * Получить все отделы
 * @route GET /api/administration/org/departments
 */
async function getAll(req, res) {
  const departments = await orgService.getAllDepartments();
  sendSuccess(res, departments);
}

/**
 * Создать отдел
 * @route POST /api/administration/org/departments
 */
async function create(req, res) {
  const department = await orgService.createDepartment(req.body);
  sendCreated(res, department);
}

/**
 * Обновить отдел
 * @route PUT /api/administration/org/departments/:id
 */
async function update(req, res) {
  const department = await orgService.updateDepartment(req.params.id, req.body);
  if (!department) return sendNotFound(res, 'Отдел не найден');
  sendSuccess(res, department);
}

/**
 * Удалить отдел
 * @route DELETE /api/administration/org/departments/:id
 */
async function remove(req, res) {
  try {
    await orgService.deleteDepartment(req.params.id);
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
