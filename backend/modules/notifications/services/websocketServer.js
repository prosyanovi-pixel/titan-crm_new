/**
 * WebSocket Server для TITAN CRM
 * Real-time уведомления и обновления
 */

const WebSocket = require('ws');
const logger = require('../../../utils/logger');

class WebSocketServer {
  constructor() {
    this.wss = null;
    this.clients = new Map();
    this.heartbeatInterval = 30000;
  }

  init(server) {
    if (!server) {
      logger.warn('[WebSocket] HTTP server not provided, skipping WebSocket init');
      return;
    }

    try {
      this.wss = new WebSocket.Server({
        server,
        path: '/ws',
        clientTracking: true
      });

      this.wss.on('connection', (ws, req) => {
        this.handleConnection(ws, req);
      });

      this.wss.on('error', (error) => {
        logger.error('[WebSocket] Server error:', error.message);
      });

      setInterval(() => {
        this.wss.clients.forEach((ws) => {
          if (ws.isAlive === false) {
            return ws.terminate();
          }
          ws.isAlive = false;
          ws.ping(() => {});
        });
      }, this.heartbeatInterval);

      logger.info('[WebSocket] Server initialized on /ws');
    } catch (error) {
      logger.error('[WebSocket] Initialization error:', error.message);
    }
  }

  handleConnection(ws, req) {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const userId = url.searchParams.get('userId') || req.headers['x-user-id'];

    if (!userId) {
      logger.warn('[WebSocket] Connection rejected: no userId');
      ws.close(4001, 'User ID required');
      return;
    }

    ws.isAlive = true;

    ws.on('pong', () => {
      ws.isAlive = true;
    });

    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message);
        logger.debug(`[WebSocket] Message from ${userId}:`, data);
        this.handleMessage(userId, data, ws);
      } catch (error) {
        logger.error('[WebSocket] Message parse error:', error.message);
      }
    });

    ws.on('close', () => {
      logger.debug(`[WebSocket] Client disconnected: ${userId}`);
      this.removeClient(userId, ws);
    });

    ws.on('error', (error) => {
      logger.error(`[WebSocket] Error for client ${userId}:`, error.message);
      this.removeClient(userId, ws);
    });

    this.addClient(userId, ws);

    this.sendToClient(ws, {
      type: 'connected',
      userId,
      timestamp: new Date().toISOString()
    });

    logger.info(`[WebSocket] Client connected: ${userId}`);
  }

  handleMessage(userId, data, ws) {
    const { type, payload } = data;

    switch (type) {
      case 'ping':
        this.sendToClient(ws, { type: 'pong', timestamp: Date.now() });
        break;
      case 'subscribe':
        if (payload?.events) {
          this.subscribe(userId, payload.events);
        }
        break;
      case 'unsubscribe':
        if (payload?.events) {
          this.unsubscribe(userId, payload.events);
        }
        break;
      default:
        logger.warn(`[WebSocket] Unknown message type: ${type}`);
    }
  }

  addClient(userId, ws) {
    if (!this.clients.has(userId)) {
      this.clients.set(userId, new Set());
    }
    this.clients.get(userId).add(ws);
  }

  removeClient(userId, ws) {
    if (this.clients.has(userId)) {
      this.clients.get(userId).delete(ws);

      if (this.clients.get(userId).size === 0) {
        this.clients.delete(userId);
      }
    }
  }

  sendToClient(ws, data) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(data));
    }
  }

  sendToUser(userId, data) {
    const userClients = this.clients.get(userId);
    if (!userClients || userClients.size === 0) {
      logger.debug(`[WebSocket] No clients for user ${userId}`);
      return false;
    }

    const message = JSON.stringify(data);
    let sentCount = 0;

    userClients.forEach((ws) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(message);
        sentCount++;
      }
    });

    logger.debug(`[WebSocket] Sent to ${sentCount} client(s) of user ${userId}`);
    return sentCount > 0;
  }

  broadcast(data) {
    const message = JSON.stringify(data);
    let sentCount = 0;

    this.wss.clients.forEach((ws) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(message);
        sentCount++;
      }
    });

    logger.debug(`[WebSocket] Broadcast to ${sentCount} client(s)`);
    return sentCount;
  }

  notifyNewMail(userId, mailData) {
    return this.sendToUser(userId, {
      type: 'new_mail',
      data: {
        mail: mailData,
        timestamp: new Date().toISOString()
      }
    });
  }

  notifySyncStatus(userId, status) {
    return this.sendToUser(userId, {
      type: 'sync_status',
      data: {
        status,
        progress: status.progress || 0,
        message: status.message || '',
        timestamp: new Date().toISOString()
      }
    });
  }

  notifyMailSent(userId, mailData) {
    return this.sendToUser(userId, {
      type: 'mail_sent',
      data: {
        mail: mailData,
        timestamp: new Date().toISOString()
      }
    });
  }

  subscribe(userId, events) {
    logger.debug(`[WebSocket] User ${userId} subscribed to:`, events);
  }

  unsubscribe(userId, events) {
    logger.debug(`[WebSocket] User ${userId} unsubscribed from:`, events);
  }

  getStats() {
    return {
      connected: this.wss?.clients?.size || 0,
      users: this.clients.size,
      clients: Array.from(this.clients.entries()).map(([userId, set]) => ({
        userId,
        connections: set.size
      }))
    };
  }

  close() {
    if (this.wss) {
      this.wss.close(() => {
        logger.info('[WebSocket] Server closed');
      });
    }
  }
}

module.exports = new WebSocketServer();