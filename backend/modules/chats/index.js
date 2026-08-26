const router = require('./routes');
const controllers = require('./controllers');
const services = require('./services');

module.exports = {
  router,
  controllers,
  services,
  prefix: '/api/chats',
};
