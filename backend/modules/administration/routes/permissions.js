/**
 * Роутер разрешений
 */

const express = require('express');
const router = express.Router();
const permissionsController = require('../controllers/permissions');
const { authMiddleware } = require('../../../middleware/auth');
const checkPermission = require('../../../middleware/checkPermission');

// Require authentication
router.use(authMiddleware);

router.get('/', checkPermission('roles.read'), permissionsController.getAll);

module.exports = router;
