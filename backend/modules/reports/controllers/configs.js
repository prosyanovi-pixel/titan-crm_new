const express = require('express');
const router = express.Router();

// Объединяем маршруты чтения/создания и модификации
const readCreate = require('./configs/readCreate');
const modify = require('./configs/modify');

// Перенаправляем все запросы на соответствующие роутеры без дополнительного вложения
router.use(readCreate);
router.use(modify);

module.exports = router;
