const logger = require('./logger');

/**
 * Wrapper для асинхронных route handlers с автоматической обработкой ошибок
 * Избавляет от необходимости писать try-catch в каждом route
 * 
 * @param {Function} fn - Асинхронная функция route handler
 * @returns {Function} - Обернутая функция с обработкой ошибок
 * 
 * @example
 * router.get('/', asyncHandler(async (req, res) => {
 *   const data = await db.query('SELECT * FROM table');
 *   res.json(data.rows);
 * }));
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch((error) => {
      // Логируем ошибку
      logger.error(`${req.method} ${req.path} failed`, error);
      
      // Определяем статус код
      const statusCode = error.statusCode || 500;
      
      // Отправляем ответ
      res.status(statusCode).json({
        error: error.message || 'Internal Server Error',
        ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
      });
    });
  };
};

/**
 * Класс для создания кастомных ошибок с HTTP статус кодами
 */
class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Специфичные типы ошибок для удобства
 */
class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(message, 404);
  }
}

class ValidationError extends AppError {
  constructor(message = 'Validation failed') {
    super(message, 400);
  }
}

class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized') {
    super(message, 401);
  }
}

class ForbiddenError extends AppError {
  constructor(message = 'Forbidden') {
    super(message, 403);
  }
}

module.exports = {
  asyncHandler,
  AppError,
  NotFoundError,
  ValidationError,
  UnauthorizedError,
  ForbiddenError
};
