const express = require('express');

const router = express.Router();

const systemRouter = require('./admin/system');
const usersRouter = require('./admin/users');

router.use('/', systemRouter);
router.use('/', usersRouter);

module.exports = router;
