/**
 * Auth Module - User authentication and password management
 * Handles login, password reset, and JWT token generation
 */
const express = require('express');
const authRoutes = require('./routes');

module.exports = function setupAuthModule(app) {
  const router = express.Router();

  /**
   * Mount auth routes
   */
  router.use('/', authRoutes);

  return router;
};
