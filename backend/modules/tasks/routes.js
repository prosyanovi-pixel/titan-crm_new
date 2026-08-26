/**
 * Маршруты модуля Tasks
 */

const express = require('express');
const router = express.Router();
const controllers = require('./controllers');

// GET /api/tasks - Получить все задачи
router.get('/', controllers.getAll);

// GET /api/tasks/stats - Получить статистику
router.get('/stats', controllers.getStats);

// GET /api/tasks/:id - Получить задачу по ID
router.get('/:id', controllers.getById);

// GET /api/tasks/:id/activity - Получить активность по задаче
router.get('/:id/activity', controllers.getActivity);

// POST /api/tasks - Создать задачу
router.post('/', controllers.create);

// PUT /api/tasks/:id - Обновить задачу
router.put('/:id', controllers.update);

// DELETE /api/tasks/:id - Удалить задачу
router.delete('/:id', controllers.remove);

// POST /api/tasks/bulk-delete - Массовое удаление
router.post('/bulk-delete', controllers.bulkDelete);

// POST /api/tasks/bulk-update - Массовое обновление
router.post('/bulk-update', controllers.bulkUpdate);

module.exports = router;
