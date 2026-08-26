/**
 * Роутер компании
 */

const express = require('express');
const router = express.Router();
const companyController = require('../controllers/company');
const companyService = require('../services/companyService');
const { asyncHandler } = require('../../../utils/errorHandler');
const { sendSuccess } = require('../../../utils/responseHelpers');

// Базовая инфо
router.get('/', asyncHandler(async (req, res) => {
  const profile = await companyService.getProfile();
  sendSuccess(res, { profile });
}));

// Профиль
router.get('/profile', companyController.getProfile);
router.put('/profile', companyController.updateProfile);

// Счета
router.get('/accounts', companyController.getAllAccounts);
router.post('/accounts', companyController.createAccount);
router.put('/accounts/:id', companyController.updateAccount);
router.delete('/accounts/:id', companyController.removeAccount);

module.exports = router;
