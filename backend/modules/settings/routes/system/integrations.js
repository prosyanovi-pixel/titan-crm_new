const express = require('express');

const router = express.Router();

router.use('/', require('./integrations/email'));
router.use('/', require('./integrations/external'));

module.exports = router;