const express = require('express');
const router = express.Router();
const servicesController = require('../controllers/servicesController');
const serviceCategoriesController = require('../controllers/serviceCategoriesController');
const checkPermission = require('../../../middleware/checkPermission');

// Service Categories
router.get('/categories/tree', checkPermission('services.read'), serviceCategoriesController.getCategoriesTree);
router.post('/categories', checkPermission('services.write'), serviceCategoriesController.createCategory);
router.put('/categories/:id', checkPermission('services.write'), serviceCategoriesController.updateCategory);
router.delete('/categories/:id', checkPermission('services.delete'), serviceCategoriesController.deleteCategory);

// Services
router.get('/', checkPermission('services.read'), servicesController.getServices);
router.get('/:id', checkPermission('services.read'), servicesController.getServiceById);
router.post('/', checkPermission('services.write'), servicesController.createService);
router.post('/bulk-delete', checkPermission('services.delete'), servicesController.bulkDeleteServices);
router.post('/bulk-update', checkPermission('services.write'), servicesController.bulkUpdateServices);
router.put('/:id', checkPermission('services.write'), servicesController.updateService);
router.delete('/:id', checkPermission('services.delete'), servicesController.deleteService);

module.exports = router;
