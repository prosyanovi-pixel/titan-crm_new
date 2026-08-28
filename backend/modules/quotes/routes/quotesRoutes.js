const express = require('express');
const router = express.Router();
const quotesController = require('../controllers/quotesController');
const checkPermission = require('../../../middleware/checkPermission');

// GET /api/quotes
router.get('/', checkPermission('quotes.view'), quotesController.getQuotes);

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
