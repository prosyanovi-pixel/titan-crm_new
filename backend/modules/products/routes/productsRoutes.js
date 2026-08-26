const express = require('express');
const router = express.Router();
const productsController = require('../controllers/productsController');
const checkPermission = require('../../../middleware/checkPermission');

// Categories
router.get('/categories', checkPermission('products.read'), productsController.getCategories);
router.post('/categories', checkPermission('products.write'), productsController.createCategory);
router.put('/categories/:id', checkPermission('products.write'), productsController.updateCategory);
router.delete('/categories/:id', checkPermission('products.delete'), productsController.deleteCategory);

// Products
router.get('/', checkPermission('products.read'), productsController.getProducts);
router.post('/export', checkPermission('products.read'), productsController.exportProducts);
router.post('/import', checkPermission('products.write'), productsController.importProducts);
router.post('/', checkPermission('products.write'), productsController.createProduct);
router.post('/bulk-delete', checkPermission('products.delete'), productsController.bulkDeleteProducts);
router.post('/bulk-update', checkPermission('products.write'), productsController.bulkUpdateProducts);
router.put('/:id', checkPermission('products.write'), productsController.updateProduct);
router.delete('/:id', checkPermission('products.delete'), productsController.deleteProduct);

module.exports = router;
