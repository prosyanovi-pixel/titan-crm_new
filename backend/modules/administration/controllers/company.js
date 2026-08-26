/**
 * Контроллер профиля и счетов компании
 */

const companyService = require('../services/companyService');
const { asyncHandler } = require('../../../utils/errorHandler');
const { sendSuccess, sendCreated, sendNotFound, sendDeleted } = require('../../../utils/responseHelpers');

/**
 * Получить профиль
 */
async function getProfile(req, res) {
  const profile = await companyService.getProfile();
  sendSuccess(res, profile);
}

/**
 * Обновить профиль
 */
async function updateProfile(req, res) {
  const profile = await companyService.updateProfile(req.body);
  sendSuccess(res, profile);
}

/**
 * Получить все счета
 */
async function getAllAccounts(req, res) {
  const accounts = await companyService.getAllAccounts();
  sendSuccess(res, accounts);
}

/**
 * Добавить счет
 */
async function createAccount(req, res) {
  const account = await companyService.createAccount(req.body);
  sendCreated(res, account);
}

/**
 * Обновить счет
 */
async function updateAccount(req, res) {
  const account = await companyService.updateAccount(req.params.id, req.body);
  if (!account) return sendNotFound(res, 'Счет не найден');
  sendSuccess(res, account);
}

/**
 * Удалить счет
 */
async function removeAccount(req, res) {
  const success = await companyService.deleteAccount(req.params.id);
  if (!success) return sendNotFound(res, 'Счет не найден');
  sendDeleted(res);
}

module.exports = {
  getProfile: asyncHandler(getProfile),
  updateProfile: asyncHandler(updateProfile),
  getAllAccounts: asyncHandler(getAllAccounts),
  createAccount: asyncHandler(createAccount),
  updateAccount: asyncHandler(updateAccount),
  removeAccount: asyncHandler(removeAccount)
};
