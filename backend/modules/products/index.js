const router = require('./routes/productsRoutes');

module.exports = {
  router,
  settings: {
    name: 'Товары',
    prefix: '/api/products',
    version: '1.0.0'
  }
};
