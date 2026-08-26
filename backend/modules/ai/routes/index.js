const express = require('express');
const router = express.Router();
const insightsController = require('../controllers/insightsController');
const checkPermission = require('../../../middleware/checkPermission');

// GET /api/ai/insights/:entityType/:entityId
router.get('/insights/:entityType/:entityId', insightsController.getInsights);

// POST /api/ai/insights/generate
router.post('/insights/generate', insightsController.generateInsight);

module.exports = router;
