/**
 * Модуль Administration
 * Объединяет управление пользователями, ролями, правами и HR-структурой
 */

const express = require('express');
const router = express.Router();

const usersRouter = require('./routes/users');
const rolesRouter = require('./routes/roles');
const permissionsRouter = require('./routes/permissions');
const employeesRouter = require('./routes/employees');
const orgRouter = require('./routes/org');
const companyRouter = require('./routes/company');
const modulesRouter = require('./routes/modules');

// Регистрация под-маршрутов
router.use('/users', usersRouter);
router.use('/roles', rolesRouter);
router.use('/permissions', permissionsRouter);
router.use('/employees', employeesRouter);
router.use('/org', orgRouter);
router.use('/company', companyRouter);
router.use('/modules', modulesRouter);

module.exports = {
  router,
  usersRouter,
  rolesRouter,
  permissionsRouter,
  employeesRouter,
  orgRouter,
  companyRouter,
  prefix: '/api/administration'
};
