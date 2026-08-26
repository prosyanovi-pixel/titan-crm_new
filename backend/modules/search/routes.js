const express = require('express');
const router = express.Router();
const searchController = require('./controllers/searchController');
const { asyncHandler } = require('../../utils/errorHandler');
const checkPermission = require('../../middleware/checkPermission');

// Require basic read permissions, or we can make it more granular per entity later
router.get('/', asyncHandler(searchController.search));

module.exports = router;
