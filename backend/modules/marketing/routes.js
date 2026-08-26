/**
 * Маршруты модуля Marketing
 */

const express = require('express');
const router = express.Router();
const controllers = require('./controllers');
const checkPermission = require('../../middleware/checkPermission');

router.get('/', checkPermission('marketing.read'), controllers.getAll);
router.get('/:id', checkPermission('marketing.read'), controllers.getById);
router.post('/', checkPermission('marketing.write'), controllers.create);
router.put('/:id', checkPermission('marketing.write'), controllers.update);
router.delete('/:id', checkPermission('marketing.delete'), controllers.remove);
router.post('/bulk-delete', checkPermission('marketing.delete'), controllers.bulkDelete);
router.post('/bulk-update', checkPermission('marketing.write'), controllers.bulkUpdate);

module.exports = router;
