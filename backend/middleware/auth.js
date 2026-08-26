const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');

const JWT_SECRET = process.env.JWT_SECRET || 'titan-crm-secret-key-2026';

const authMiddleware = (req, res, next) => {
  const clientIp = req.ip || req.connection?.remoteAddress || req.socket?.remoteAddress;
  const userAgent = req.headers['user-agent'] || 'unknown';

  // Check if auth is disabled
  if (process.env.DISABLE_AUTH === 'true') {
    req.user = {
      id: '1',
      name: 'Test User',
      role: 'admin'
    };
    logger.debug('Auth disabled - mock user assigned', { ip: clientIp, path: req.path });
    return next();
  }

  // Get token from header or query param (for direct links/downloads)
  const token = req.headers.authorization?.replace('Bearer ', '') || req.query.token;

  if (!token) {
    logger.warn('Missing authorization token', { ip: clientIp, path: req.path, userAgent });
    return res.status(401).json({ error: 'Требуется авторизация' });
  }

  // 1. Check for mock token (legacy/development)
  if (token.startsWith('mock_token_')) {
    const userId = token.replace('mock_token_', '');
    req.user = {
      id: userId,
      name: 'User',
      role: 'user'
    };
    logger.debug('Valid mock token', { userId, ip: clientIp, path: req.path });
    return next();
  }

  // 2. Verify real JWT token
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    return next();
  } catch (err) {
    logger.warn('Invalid JWT token', { 
        ip: clientIp, 
        error: err.message,
        tokenPrefix: token.substring(0, 15) 
    });
    return res.status(401).json({ error: 'Неверный или просроченный токен авторизации' });
  }
};

const optionalAuthMiddleware = (req, res, next) => {
  if (process.env.DISABLE_AUTH === 'true') {
    req.user = { id: '1', name: 'Test User', role: 'admin' };
    return next();
  }

  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return next();

  if (token.startsWith('mock_token_')) {
    const userId = token.replace('mock_token_', '');
    req.user = { id: userId, name: 'User', role: 'user' };
    return next();
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
  } catch (err) {
    // Ignore errors for optional auth
  }
  next();
};

module.exports = { authMiddleware, optionalAuthMiddleware };

