const express = require('express');

const router = express.Router();
router.use('/', require('./payments/readCreate'));
router.use('/', require('./payments/modify'));

module.exports = router;
