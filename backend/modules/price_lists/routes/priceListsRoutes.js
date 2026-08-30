const express = require('express');
const router = express.Router();
const priceListsController = require('../controllers/priceListsController');
const checkPermission = require('../../../middleware/checkPermission');

// GET /api/price-lists
router.get('/', checkPermission('settings.read'), priceListsController.getPriceLists);

// POST /api/price-lists/bulk-update — массовое изменение is_active / is_default
router.post('/bulk-update', checkPermission('settings.write'), priceListsController.bulkUpdatePriceLists);

// POST /api/price-lists/bulk-delete — массовое удаление
router.post('/bulk-delete', checkPermission('settings.delete'), priceListsController.bulkDeletePriceLists);

// GET /api/price-lists/:id
router.get('/:id', checkPermission('settings.read'), priceListsController.getPriceList);

// POST /api/price-lists
router.post('/', checkPermission('settings.write'), priceListsController.createPriceList);

// PUT /api/price-lists/:id
router.put('/:id', checkPermission('settings.write'), priceListsController.updatePriceList);

// DELETE /api/price-lists/:id
router.delete('/:id', checkPermission('settings.delete'), priceListsController.deletePriceList);

// POST /api/price-lists/:id/items
router.post('/:id/items', checkPermission('settings.write'), priceListsController.setPriceListItem);

// GET /api/price-lists/:id/items
router.get('/:id/items', checkPermission('settings.read'), priceListsController.getPriceListItems);

module.exports = router;
