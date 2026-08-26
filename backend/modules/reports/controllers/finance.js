const express = require('express');
const router = express.Router();
router.use('/', require('./finance/summary'));
router.use('/', require('./finance/register'));

module.exports = router;
