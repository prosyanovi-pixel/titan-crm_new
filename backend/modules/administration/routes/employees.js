/**
 * Роутер сотрудников
 */

const express = require('express');
const router = express.Router();
const employeesController = require('../controllers/employees');
const { authMiddleware } = require('../../../middleware/auth');
const checkPermission = require('../../../middleware/checkPermission');

// Require authentication for all employee routes
router.use(authMiddleware);

router.get('/', checkPermission('employees.read'), employeesController.getAll);
router.get('/:id', checkPermission('employees.read'), employeesController.getById);
router.post('/', checkPermission('employees.write'), employeesController.create);
router.put('/:id', checkPermission('employees.write'), employeesController.update);
router.delete('/:id', checkPermission('employees.delete'), employeesController.remove);

module.exports = router;
