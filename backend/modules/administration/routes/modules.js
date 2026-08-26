const express = require('express');
const router = express.Router();
const modulesController = require('../controllers/modules');
const checkPermission = require('../../../middleware/checkPermission');

// GET /api/administration/modules - получить все модули
router.get('/', checkPermission('settings.read'), modulesController.getModules);

// PATCH /api/administration/modules/:id/toggle - включить/выключить модуль
router.patch('/:id/toggle', checkPermission('settings.write'), modulesController.toggleModule);

module.exports = router;
