/**
 * Главный файл модуля Registry
 * Экспортирует настройки (API отсутствует)
 */

const settings = require('./settings');

module.exports = {
  settings,
  prefix: '/api/registry',
  // Пустой роутер, так как API отсутствует
  router: require('express').Router(),
};
