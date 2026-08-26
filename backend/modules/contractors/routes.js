/**
 * Маршруты модуля Contractors
 */

const express = require('express');
const router = express.Router();
const controllers = require('./controllers');
const taxRoutes = require('./taxRoutes');
const checkPermission = require('../../middleware/checkPermission');

// Основные CRUD операции
router.get('/', controllers.getAll);
router.post('/', controllers.create);
router.post('/bulk-update', controllers.bulkUpdate);
router.post('/bulk-delete', controllers.bulkDelete);

// Налоговые эндпоинты
router.use('/', taxRoutes);

router.get('/:id', controllers.getById);
router.get('/:id/activity/chart', controllers.getActivityChart);
router.get('/:id/activity', controllers.getActivity);
router.delete('/:id/activity/:activityId', checkPermission('contractors.delete'), controllers.removeActivity);
router.put('/:id', controllers.update);
router.post('/:id/convert', controllers.convert);
router.delete('/:id', controllers.remove);

module.exports = router;
