const express = require('express');
const router = express.Router();
const warehouseController = require('./controllers/warehouseController');
const inventoryController = require('./controllers/inventoryController');
const checkPermission = require('../../middleware/checkPermission');

// --- Склады (Warehouses) ---
router.get('/warehouses', checkPermission('warehouse.read'), warehouseController.getWarehouses);
router.post('/warehouses', checkPermission('warehouse.write'), warehouseController.createWarehouse);
router.post('/warehouses/bulk-delete', checkPermission('warehouse.delete'), warehouseController.bulkDeleteWarehouses);
router.post('/warehouses/bulk-update', checkPermission('warehouse.write'), warehouseController.bulkUpdateWarehouses);
router.put('/warehouses/:id', checkPermission('warehouse.write'), warehouseController.updateWarehouse);
router.delete('/warehouses/:id', checkPermission('warehouse.delete'), warehouseController.deleteWarehouse);

// --- Остатки и транзакции (Inventory) ---
router.get('/balances', checkPermission('warehouse.read'), inventoryController.getBalances);
router.get('/balances/:productId', checkPermission('warehouse.read'), inventoryController.getProductBalance);
router.post('/transactions', checkPermission('warehouse.write'), inventoryController.createTransaction);
router.get('/transactions', checkPermission('warehouse.read'), inventoryController.getTransactions);

// --- Заявки на закупку (Purchase Requests) ---
router.get('/purchase-requests', checkPermission('warehouse.read'), inventoryController.getPurchaseRequests);
router.post('/purchase-requests', checkPermission('warehouse.write'), inventoryController.createPurchaseRequest);
router.put('/purchase-requests/:id', checkPermission('warehouse.write'), inventoryController.updatePurchaseRequest);

module.exports = router;
