/**
 * Главный файл модуля Projects
 * Экспортирует роутер и настройки
 */

const router = require('./routes');
const settings = require('./settings');

module.exports = {
  router,
  settings,
  prefix: '/api/projects',
};
