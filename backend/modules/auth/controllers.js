/**
 * Auth Controllers - handles HTTP requests for authentication
 */
const authService = require('./services/authService');
const logger = require('../../utils/logger');

/**
 * POST /api/auth/login - Authenticate user
 */
async function login(req, res) {
  try {
    const { identifier, email, password } = req.body;
    const loginValue = identifier || email;
    const clientIp = req.ip || req.connection?.remoteAddress || req.socket?.remoteAddress;
    const userAgent = req.headers['user-agent'] || 'unknown';

    const result = await authService.login(loginValue, password, clientIp, userAgent);

    res.json(result);
  } catch (err) {
    logger.error('Login error', { error: err.message, stack: err.stack });
    const statusCode = err.message.includes('не найден') ? 401 : 400;
    res.status(statusCode).json({ error: err.message });
  }
}

/**
 * POST /api/auth/forgot-password - Request password reset
 */
async function forgotPassword(req, res) {
  try {
    const { identifier, method } = req.body;

    if (!identifier) {
      return res.status(400).json({ error: 'Требуется указать email или никнейм' });
    }

    const result = await authService.requestPasswordReset(identifier, method);

    res.json(result);
  } catch (err) {
    logger.error('Forgot password error', err);
    res.status(400).json({ error: err.message });
  }
}

/**
 * POST /api/auth/reset-password - Reset password with token
 */
async function resetPassword(req, res) {
  try {
    const { token, newPassword } = req.body;

    const result = await authService.resetPassword(token, newPassword);

    res.json(result);
  } catch (err) {
    logger.error('Reset password error', err);
    const statusCode = err.message.includes('недействителен') ? 400 : 400;
    res.status(statusCode).json({ error: err.message });
  }
}

module.exports = {
  login,
  forgotPassword,
  resetPassword,
};
