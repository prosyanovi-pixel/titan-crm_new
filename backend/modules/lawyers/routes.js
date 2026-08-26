/**
 * Маршруты модуля Lawyers
 */

const express = require('express');
const router = express.Router();
const controllers = require('./controllers');

// GET /api/lawyers - Получить всех юристов
router.get('/', controllers.getAll);

// GET /api/lawyers/:id - Получить юриста по ID
router.get('/:id', controllers.getById);

// POST /api/lawyers - Создать юриста
router.post('/', controllers.create);

// PUT /api/lawyers/:id - Обновить юриста
router.put('/:id', controllers.update);

// DELETE /api/lawyers/:id - Удалить юриста
router.delete('/:id', controllers.remove);

module.exports = router;
