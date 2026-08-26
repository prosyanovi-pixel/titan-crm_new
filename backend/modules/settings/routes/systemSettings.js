const express = require('express');

const router = express.Router();

router.use('/', require('./system/core'));
router.use('/', require('./system/integrations'));

module.exports = router;