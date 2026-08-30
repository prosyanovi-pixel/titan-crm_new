const express = require('express');
const router = express.Router();
const salesController = require('./controllers/salesController');
const checkPermission = require('../../middleware/checkPermission');

// POST /api/sales/deals/wizard
router.post('/deals/wizard', checkPermission('projects.create'), salesController.createDealFromWizard);

module.exports = router;
