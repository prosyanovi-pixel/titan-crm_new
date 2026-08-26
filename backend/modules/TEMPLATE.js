/**
 * Шаблон модуля TITAN CRM
 * 
 * Эта директория содержит пример структуры для всех модулей.
 * Удалите этот файл после создания реальных модулей.
 */

module.exports = {
  // Пример структуры index.js
  indexExample: `/**
 * Главный файл модуля
 * Экспортирует роутер и настройки
 */

const router = require('./routes');
const settings = require('./settings');

module.exports = {
  router,
  settings,
  prefix: '/api/<module_name>',
};
`,

  // Пример структуры routes.js
  routesExample: `/**
 * Маршруты модуля
 */

const express = require('express');
const router = express.Router();
const controllers = require('./controllers');

// GET /api/<module> - Получить все записи
router.get('/', controllers.getAll);

// GET /api/<module>/:id - Получить запись по ID
router.get('/:id', controllers.getById);

// POST /api/<module> - Создать запись
router.post('/', controllers.create);

// PUT /api/<module>/:id - Обновить запись
router.put('/:id', controllers.update);

// DELETE /api/<module>/:id - Удалить запись
router.delete('/:id', controllers.remove);

module.exports = router;
`,

  // Пример структуры controllers.js
  controllersExample: `/**
 * Контроллеры модуля
 * Обработчики HTTP-запросов
 */

const { asyncHandler } = require('../../utils/errorHandler');
const { sendSuccess, sendCreated, sendNotFound, sendDeleted } = require('../../utils/responseHelpers');
const db = require('../../db');

/**
 * Получить все записи
 */
async function getAll(req, res) {
  const { search, limit } = req.query;
  // Логика получения данных
  sendSuccess(res, []);
}

/**
 * Получить запись по ID
 */
async function getById(req, res) {
  const { id } = req.params;
  // Логика получения по ID
  sendSuccess(res, {});
}

/**
 * Создать запись
 */
async function create(req, res) {
  const data = req.body;
  // Логика создания
  sendCreated(res, {});
}

/**
 * Обновить запись
 */
async function update(req, res) {
  const { id } = req.params;
  const data = req.body;
  // Логика обновления
  sendSuccess(res, {});
}

/**
 * Удалить запись
 */
async function remove(req, res) {
  const { id } = req.params;
  // Логика удаления
  sendDeleted(res);
}

module.exports = {
  getAll,
  getById,
  create,
  update,
  remove,
};
`,
};
