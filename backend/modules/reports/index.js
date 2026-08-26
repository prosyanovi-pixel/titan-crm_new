/**
 * Главный файл модуля Reports
 * Экспортирует роутер и настройки
 */

const router = require('./routes');
const settings = require('./settings');

module.exports = router;
module.exports.router = router;
module.exports.settings = settings;
module.exports.prefix = '/api/reports';
