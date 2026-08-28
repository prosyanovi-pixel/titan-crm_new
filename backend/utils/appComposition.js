const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const logger = require('./logger');
const db = require('../db');
const documentsModule = require('../modules/documents');
const { registerModuleRouters } = require('./moduleSettingsLoader');
const settingsModule = require('../modules/settings');
const administrationModule = require('../modules/administration');
const profileModule = require('../modules/profile');
const authModule = require('../modules/auth');
const logsModule = require('../modules/logs');
const backupModule = require('../modules/backup');
const trashModule = require('../modules/trash');
const {
  legacyAdministrationRoutes,
  legacySettingsRoutes,
  legacyProfileRoutes,
  legacyAdminRoutes,
  standardRoutes,
} = require('./routeRegistry');

async function configureApplication(app) {
  const logsDir = path.join(__dirname, '../logs');
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
  }

  app.use(cors());
  app.use((req, res, next) => {
    const contentType = req.headers['content-type'] || '';
    if (contentType.includes('multipart/form-data')) {
      return next();
    }

    express.json({ limit: '10mb' })(req, res, (err) => {
      if (err) return next(err);
      express.urlencoded({ extended: true, limit: '10mb' })(req, res, next);
    });
  });
  app.use('/uploads', require('express').static(path.join(__dirname, '../uploads')));

  app.get('/api/files/legal-cases/:filename', (req, res) => {
    const filename = req.params.filename;
    let filePath = path.join(__dirname, '../uploads/legal-cases', filename);

    if (!fs.existsSync(filePath)) {
      filePath = path.join(__dirname, '../uploads/documents', filename);
    }

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found' });
    }

    res.sendFile(filePath);
  });

  app.use(async (req, res, next) => {
    const userId = req.headers['x-user-id'];
    if (!userId) return next();

    const fullPath = req.originalUrl || req.path;
    const isAuthPath = fullPath.startsWith('/api/auth');
    const isUnblockPath = fullPath.match(/\/api\/admin\/users\/.+\/unblock/);
    const isModuleSettingsPath = fullPath.startsWith('/api/module-settings');
    if (isAuthPath || isUnblockPath || isModuleSettingsPath) return next();

    try {
      const { rows } = await db.query(
        `UPDATE users
         SET last_active_at = CASE WHEN last_active_at IS NULL OR last_active_at < NOW() - INTERVAL '30 seconds' THEN NOW() ELSE last_active_at END
         WHERE id = $1
         RETURNING is_blocked`,
        [userId]
      );
      if (rows.length && rows[0].isBlocked) {
        return res.status(403).json({ error: 'Your account is blocked. Please contact the administrator.' });
      }
    } catch {
      // do not block request on tracking error
    }

    next();
  });

  app.use((req, res, next) => {
    const start = Date.now();

    logger.debug(`Incoming request: ${req.method} ${req.path}`, {
      userId: req.headers['x-user-id'],
      ip: req.ip || req.connection?.remoteAddress,
    });

    res.on('finish', () => {
      const duration = Date.now() - start;
      logger.http(req, res, duration);
    });

    next();
  });

  app.use(settingsModule.prefix, settingsModule.router);
  app.use(administrationModule.prefix, administrationModule.router);
  app.use(documentsModule.prefix, documentsModule.router);

  legacyAdministrationRoutes.forEach(([routePath, router]) => app.use(routePath, router));
  legacyProfileRoutes.forEach(([routePath, router]) => app.use(routePath, router));
  legacyAdminRoutes.forEach(([routePath, router]) => app.use(routePath, router));
  legacySettingsRoutes.forEach(([routePath, router]) => app.use(routePath, router));

  app.use('/api/auth', authModule(app));
  app.use('/api/logs', logsModule(app));
  app.use('/api/backup', backupModule(app));
  app.use(trashModule.prefix, trashModule.router);
  app.use('/api/comments', require('../modules/comments/routes'));
  app.use('/api/price-lists', require('../modules/price_lists/routes/priceListsRoutes'));
  app.use('/api/quotes', require('../modules/quotes/routes/quotesRoutes'));

  standardRoutes.forEach(([routePath, router]) => app.use(routePath, router));
  
  // Await async module router registration
  await registerModuleRouters(app);

  app.use((err, req, res, next) => {
    logger.error(`Unhandled error: ${req.method} ${req.path}`, {
      error: err.message,
      stack: err.stack,
      userId: req.headers['x-user-id'],
      body: req.body,
      query: req.query,
    });
    res.status(500).json({ error: 'Internal Server Error' });
  });
}

module.exports = {
  configureApplication,
};