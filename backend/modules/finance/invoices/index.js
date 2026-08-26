/**
 * Маршруты для счетов
 * Файл: routes/finance/invoices/index.js
 */

const express = require('express');
const { asyncHandler } = require('../../../utils/errorHandler');
const handlers = require('./handlers');

const router = express.Router();

// GET /finance/invoices - Получить все счета
router.get('/', asyncHandler(handlers.getAll));

// GET /finance/invoices/:id - Получить счёт по ID
router.get('/:id', asyncHandler(handlers.getById));

// POST /finance/invoices - Создать счёт
router.post('/', asyncHandler(handlers.create));

// PUT /finance/invoices/:id - Обновить счёт
router.put('/:id', asyncHandler(handlers.update));

// POST /finance/invoices/:id/send - Отправить счёт
router.post('/:id/send', asyncHandler(handlers.send));

// POST /finance/invoices/:id/recalculate-status - Пересчитать статус
router.post('/:id/recalculate-status', asyncHandler(handlers.recalculateStatus));

// POST /finance/invoices/:id/generate-document - Сгенерировать документ
router.post('/:id/generate-document', asyncHandler(handlers.generateDocument));

// DELETE /finance/invoices/:id - Удалить счёт
router.delete('/:id', asyncHandler(handlers.remove));

// POST /finance/invoices/bulk-update - Массовое обновление
router.post('/bulk-update', asyncHandler(handlers.bulkUpdate));

module.exports = router;
