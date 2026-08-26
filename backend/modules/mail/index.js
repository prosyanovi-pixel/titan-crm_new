/**
 * Главный файл модуля Mail
 * Экспортирует роутер, настройки и сервисы
 */

const router = require('./routes');
const settings = require('./settings');
const controllers = require('./controllers');

// Обновляем роуты чтобы использовали контроллеры из поддиректорий
// (роуты импортируют через require('./controllers'))

// Запуск шедулера при старте модуля
const mailScheduler = require('./services/mailScheduler');
mailScheduler.start();

module.exports = {
  router,
  settings,
  controllers,
  services: {
    mailScheduler,
    mailSyncService: require('./services/mailSyncService'),
    mailSendService: require('./services/mailSendService'),
    mailConnectionManager: require('./services/mailConnectionManager'),
    mailFilterEngine: require('./services/mailFilterEngine'),
  },
  prefix: '/api/mail',
};
