/**
 * Главный файл модуля Tasks
 * Экспортирует роутер и настройки
 */

const router = require('./routes');
const settings = require('./settings');

module.exports = {
  router,
  settings,
  prefix: '/api/tasks',
};
