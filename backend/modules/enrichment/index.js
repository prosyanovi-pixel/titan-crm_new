/**
 * Главный файл модуля Enrichment
 * Экспортирует роутер и сервисы обогащения
 */

const router = require('./routes');

module.exports = {
  router,
  settings: {
    display: {
      itemsPerPage: 15,
      defaultSort: 'name'
    },
    features: {
      enableEnrichment: true,
      autoEnrichOnCreate: false
    },
    apiKeys: {
      dadataKey: '',
      apifnsKey: '',
      priorityService: 'dadata'
    },
    prefix: '/api/enrichment'
  },
  services: {
    enrichmentCore: require('./services/enrichmentCore'),
    enrichmentJob: require('./services/enrichmentJob'),
  },
  prefix: '/api/enrichment',
};
