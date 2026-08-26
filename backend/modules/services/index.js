const router = require('./routes/servicesRoutes');

module.exports = {
  router,
  settings: {
    name: 'Услуги',
    prefix: '/api/services',
    version: '1.0.0'
  }
};
