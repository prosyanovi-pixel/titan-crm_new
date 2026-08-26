/**
 * Маршруты модуля Dashboard
 */

const express = require('express');
const router = express.Router();
const controllers = require('./controllers');

// GET /api/dashboard/stats - Получить статистику дашборда
router.get('/stats', controllers.getStats);

module.exports = router;
