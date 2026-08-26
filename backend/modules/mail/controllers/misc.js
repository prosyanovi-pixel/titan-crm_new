/**
 * Mail Module - Misc Controller
 * Статус scheduler, WebSocket
 */

async function getSchedulerStatus(req, res) {
  const scheduler = require('../services/mailScheduler');
  res.json(scheduler.getStatus());
}

async function getWebsocketStatus(req, res) {
  const websocketServer = require('../../../modules/notifications/services/websocketServer');
  res.json(websocketServer.getStats());
}

module.exports = {
  getSchedulerStatus,
  getWebsocketStatus,
};
