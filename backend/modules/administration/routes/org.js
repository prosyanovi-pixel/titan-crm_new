/**
 * Роутер оргструктуры
 */

const express = require('express');
const router = express.Router();
const departmentsController = require('../controllers/departments');
const positionsController = require('../controllers/positions');
const orgService = require('../services/orgService');
const { authMiddleware } = require('../../../middleware/auth');
const checkPermission = require('../../../middleware/checkPermission');
const { asyncHandler } = require('../../../utils/errorHandler');
const { sendSuccess } = require('../../../utils/responseHelpers');

// Require authentication for all org routes
router.use(authMiddleware);

// Базовая инфо
router.get('/', checkPermission('employees.read'), asyncHandler(async (req, res) => {
  const info = await orgService.getOrgInfo();
  sendSuccess(res, info);
}));

// Отделы
router.get('/departments', checkPermission('employees.read'), departmentsController.getAll);
router.post('/departments', checkPermission('employees.write'), departmentsController.create);
router.put('/departments/:id', checkPermission('employees.write'), departmentsController.update);
router.delete('/departments/:id', checkPermission('employees.delete'), departmentsController.remove);

// Должности
router.get('/positions', checkPermission('employees.read'), positionsController.getAll);
router.post('/positions', checkPermission('employees.write'), positionsController.create);
router.put('/positions/:id', checkPermission('employees.write'), positionsController.update);
router.delete('/positions/:id', checkPermission('employees.delete'), positionsController.remove);

module.exports = router;
