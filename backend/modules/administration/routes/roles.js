/**
 * Роутер ролей
 */

const express = require('express');
const router = express.Router();
const rolesController = require('../controllers/roles');
const { authMiddleware } = require('../../../middleware/auth');
const checkPermission = require('../../../middleware/checkPermission');

// Require authentication for all role routes
router.use(authMiddleware);

router.get('/', checkPermission('roles.read'), rolesController.getAll);
router.post('/', checkPermission('roles.write'), rolesController.create);
router.put('/:id', checkPermission('roles.write'), rolesController.update);
router.delete('/:id', checkPermission('roles.delete'), rolesController.remove);

module.exports = router;
