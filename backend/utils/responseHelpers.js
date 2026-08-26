/**
 * Утилиты для стандартизации HTTP ответов
 */

/**
 * Отправляет успешный ответ с данными
 * @param {Object} res - Express response объект
 * @param {*} data - Данные для отправки
 * @param {number} statusCode - HTTP статус код (по умолчанию 200)
 * @returns {Object} - Express response
 */
const sendSuccess = (res, data, statusCode = 200) => {
  return res.status(statusCode).json(data);
};

/**
 * Отправляет успешный ответ о создании ресурса
 * @param {Object} res - Express response объект
 * @param {*} data - Созданный ресурс
 * @returns {Object} - Express response
 */
const sendCreated = (res, data) => {
  return res.status(201).json(data);
};

/**
 * Отправляет успешный ответ без содержимого (например, после DELETE)
 * @param {Object} res - Express response объект
 * @returns {Object} - Express response
 */
const sendNoContent = (res) => {
  return res.status(204).send();
};

/**
 * Отправляет ответ об успешном удалении
 * @param {Object} res - Express response объект
 * @param {string} message - Сообщение (опционально)
 * @returns {Object} - Express response
 */
const sendDeleted = (res, message = 'Deleted successfully') => {
  return res.status(200).json({ success: true, message });
};

/**
 * Отправляет ответ с ошибкой валидации
 * @param {Object} res - Express response объект
 * @param {string} message - Сообщение об ошибке
 * @param {Object} errors - Детали ошибок валидации (опционально)
 * @returns {Object} - Express response
 */
const sendValidationError = (res, message = 'Validation error', errors = null) => {
  return res.status(400).json({
    error: message,
    ...(errors && { details: errors })
  });
};

/**
 * Отправляет ответ о том, что ресурс не найден
 * @param {Object} res - Express response объект
 * @param {string} message - Сообщение об ошибке
 * @returns {Object} - Express response
 */
const sendNotFound = (res, message = 'Resource not found') => {
  return res.status(404).json({ error: message });
};

/**
 * Отправляет ответ об ошибке авторизации
 * @param {Object} res - Express response объект
 * @param {string} message - Сообщение об ошибке
 * @returns {Object} - Express response
 */
const sendUnauthorized = (res, message = 'Unauthorized') => {
  return res.status(401).json({ error: message });
};

/**
 * Отправляет ответ о запрете доступа
 * @param {Object} res - Express response объект
 * @param {string} message - Сообщение об ошибке
 * @returns {Object} - Express response
 */
const sendForbidden = (res, message = 'Forbidden') => {
  return res.status(403).json({ error: message });
};

/**
 * Отправляет ответ о внутренней ошибке сервера
 * @param {Object} res - Express response объект
 * @param {string} message - Сообщение об ошибке
 * @param {Error} error - Объект ошибки (опционально, только в dev режиме)
 * @returns {Object} - Express response
 */
const sendServerError = (res, message = 'Internal server error', error = null) => {
  return res.status(500).json({
    error: message,
    ...(process.env.NODE_ENV === 'development' && error && { stack: error.stack })
  });
};

/**
 * Отправляет пагинированный ответ
 * @param {Object} res - Express response объект
 * @param {Array} data - Массив данных
 * @param {Object} pagination - Информация о пагинации
 * @param {number} pagination.page - Текущая страница
 * @param {number} pagination.limit - Лимит элементов на странице
 * @param {number} pagination.total - Общее количество элементов
 * @returns {Object} - Express response
 */
const sendPaginated = (res, data, pagination) => {
  return res.status(200).json({
    data,
    pagination: {
      page: pagination.page,
      limit: pagination.limit,
      total: pagination.total,
      totalPages: Math.ceil(pagination.total / pagination.limit)
    }
  });
};

module.exports = {
  sendSuccess,
  sendCreated,
  sendNoContent,
  sendDeleted,
  sendValidationError,
  sendNotFound,
  sendUnauthorized,
  sendForbidden,
  sendServerError,
  sendPaginated
};
