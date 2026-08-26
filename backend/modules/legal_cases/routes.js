/**
 * Главный роутер модуля Legal Cases
 * Объединяет все подмодули
 */

const express = require('express');
const router = express.Router();

// Импортируем подмодули
const casesRouter = require('./controllers/cases');
const documentsRouter = require('./controllers/documents');
const instancesRouter = require('./controllers/instances');
const courtsRouter = require('./controllers/courts');
const caseOutcomesRouter = require('./controllers/caseOutcomes');

// Подключаем подмодули
router.use('/', casesRouter);
router.use('/documents', documentsRouter);
router.use('/', instancesRouter); // Instances routes (e.g. /:id/instances)
router.use('/courts', courtsRouter);
router.use('/case-outcomes', caseOutcomesRouter);

module.exports = router;
