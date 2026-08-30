const express = require('express');
const router = express.Router();
const quotesController = require('../controllers/quotesController');
const checkPermission = require('../../../middleware/checkPermission');

// GET /api/quotes
router.get('/', checkPermission('quotes.view'), quotesController.getQuotes);

// POST /api/quotes/bulk-update — массовое изменение статуса
router.post('/bulk-update', checkPermission('quotes.edit'), quotesController.bulkUpdateQuotes);

// POST /api/quotes/bulk-delete — массовое удаление
router.post('/bulk-delete', checkPermission('quotes.delete'), quotesController.bulkDeleteQuotes);

// GET /api/quotes/:id
router.get('/:id', checkPermission('quotes.view'), quotesController.getQuoteById);

// GET /api/quotes/:id/pdf
router.get('/:id/pdf', checkPermission('quotes.view'), quotesController.generatePdf);

// POST /api/quotes
router.post('/', checkPermission('quotes.create'), quotesController.createQuote);

// PUT /api/quotes/:id
router.put('/:id', checkPermission('quotes.edit'), quotesController.updateQuote);

// DELETE /api/quotes/:id
router.delete('/:id', checkPermission('quotes.delete'), quotesController.deleteQuote);

module.exports = router;
