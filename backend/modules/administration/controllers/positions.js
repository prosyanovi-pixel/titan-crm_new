/**
 * Контроллер должностей
 */

const orgService = require('../services/orgService');
const { asyncHandler } = require('../../../utils/errorHandler');
const { sendSuccess, sendCreated, sendNotFound, sendDeleted, sendValidationError } = require('../../../utils/responseHelpers');

/**
 * Получить все должности
 * @route GET /api/administration/org/positions
 */
async function getAll(req, res) {
  const positions = await orgService.getAllPositions();
  sendSuccess(res, positions);
}

/**
 * Создать должность
 * @route POST /api/administration/org/positions
 */
async function create(req, res) {
  const position = await orgService.createPosition(req.body);
  sendCreated(res, position);
}

/**
 * Обновить должность
 * @route PUT /api/administration/org/positions/:id
 */
async function update(req, res) {
  const position = await orgService.updatePosition(req.params.id, req.body);
  if (!position) return sendNotFound(res, 'Должность не найдена');
  sendSuccess(res, position);
}

/**
 * Удалить должность
 * @route DELETE /api/administration/org/positions/:id
 */
async function remove(req, res) {
  try {
    await orgService.deletePosition(req.params.id);
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
