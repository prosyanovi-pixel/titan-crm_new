/**
 * Контроллер сотрудников
 */

const employeeService = require('../services/employeeService');
const { asyncHandler } = require('../../../utils/errorHandler');
const { sendSuccess, sendCreated, sendNotFound, sendDeleted } = require('../../../utils/responseHelpers');

/**
 * Получить всех сотрудников
 * @route GET /api/administration/employees
 */
async function getAll(req, res) {
  const employees = await employeeService.getAllEmployees(req.query);
  sendSuccess(res, employees);
}

/**
 * Получить сотрудника по ID
 * @route GET /api/administration/employees/:id
 */
async function getById(req, res) {
  const employee = await employeeService.getEmployeeById(req.params.id);
  if (!employee) return sendNotFound(res, 'Сотрудник не найден');
  sendSuccess(res, employee);
}

/**
 * Создать сотрудника
 * @route POST /api/administration/employees
 */
async function create(req, res) {
  const employee = await employeeService.createEmployee(req.body);
  sendCreated(res, employee);
}

/**
 * Обновить сотрудника
 * @route PUT /api/administration/employees/:id
 */
async function update(req, res) {
  const employee = await employeeService.updateEmployee(req.params.id, req.body);
  if (!employee) return sendNotFound(res, 'Сотрудник не найден');
  sendSuccess(res, employee);
}

/**
 * Удалить сотрудника
 * @route DELETE /api/administration/employees/:id
 */
async function remove(req, res) {
  const success = await employeeService.deleteEmployee(req.params.id);
  if (!success) return sendNotFound(res, 'Сотрудник не найден');
  sendDeleted(res);
}

module.exports = {
  getAll: asyncHandler(getAll),
  getById: asyncHandler(getById),
  create: asyncHandler(create),
  update: asyncHandler(update),
  remove: asyncHandler(remove)
};
