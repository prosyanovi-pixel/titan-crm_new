const express = require('express');
const router = express.Router();
const warehouseRoutes = require('./routes');

// Подключение роутов склада
router.use('/', warehouseRoutes);

// Экспортируем роутер
module.exports = router;
module.exports.router = router;

// Настройки модуля
module.exports.settings = {
  features: {
    allowOversell: true, // разрешить продажу в минус
    autoCreatePurchaseRequest: true, // автосоздание заявки на закупку при минусе
    enableAuditLog: true // вести лог транзакций
  },
  display: {
    defaultSort: 'name_asc',
    itemsPerPage: 25
  }
};
