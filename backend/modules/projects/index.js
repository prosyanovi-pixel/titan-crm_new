/**
 * Главный файл модуля Projects
 * Экспортирует роутер и настройки
 */

const router = require('./routes');
const settings = require('./settings');

// Инициализация интеграции бизнес-процессов продаж
require('./salesIntegration');

module.exports = {
  router,
  settings,
  prefix: '/api/projects',
};
