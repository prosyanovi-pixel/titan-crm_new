/**
 * Главный роутер модуля Documents
 */

const express = require('express');
const router = express.Router();

// Импортируем контроллеры
const documentsRouter = require('./controllers/documents');

// Подключаем маршруты
router.use('/', documentsRouter);

module.exports = router;
