/**
 * Главный роутер для управления банковскими выписками
 */

const express = require('express');
const { asyncHandler } = require('../../../../utils/errorHandler');

const { getAll, getLines } = require('./readHandlers');
const { reconcile, updateLine, remove } = require('./writeHandlers');
const { importStatement } = require('./importHandler');

const router = express.Router();

// Маршруты
router.get('/', asyncHandler(getAll));
router.get('/:id/lines', asyncHandler(getLines));
router.post('/import', asyncHandler(importStatement));
router.post('/:id/reconcile', asyncHandler(reconcile));
router.put('/lines/:lineId', asyncHandler(updateLine));
router.delete('/:id', asyncHandler(remove));

module.exports = router;
