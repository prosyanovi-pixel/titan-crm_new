/**
 * Auth Routes - API endpoints for authentication
 */
const express = require('express');
const router = express.Router();
const authControllers = require('./controllers');

/**
 * GET /api/auth - Info endpoint
 */
router.get('/', (req, res) => {
  res.json({ message: 'Auth API. Use /auth/login (POST) for authentication.' });
});

/**
 * POST /api/auth/login - Authenticate user
 * Body: { identifier | email, password }
 */
router.post('/login', authControllers.login);

/**
 * POST /api/auth/forgot-password - Request password reset
 * Body: { identifier, method?: 'email' | 'telegram' }
 */
router.post('/forgot-password', authControllers.forgotPassword);

/**
 * POST /api/auth/reset-password - Reset password with token
 * Body: { token, newPassword }
 */
router.post('/reset-password', authControllers.resetPassword);

module.exports = router;
