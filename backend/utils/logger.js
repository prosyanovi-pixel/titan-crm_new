const fs = require('fs');
const path = require('path');

// Убеждаемся, что директория для логов существует
const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Кэш для настройки log_to_db (обновляется периодически)
let _logToDbCache = { value: false, lastCheck: 0 };
const CACHE_TTL = 5000; // 5 секунд

/**
 * Проверка, включено ли логирование в базу данных
 * Читает из таблицы system_settings с кэшированием
 */
function isLogToDbEnabled() {
  const now = Date.now();
  if (now - _logToDbCache.lastCheck < CACHE_TTL) {
    return _logToDbCache.value;
  }

  try {
    // Отложенное подключение для предотвращения круговой зависимости
    const db = require('../db');
    const result = db.query(
      "SELECT value FROM system_settings WHERE setting_key = 'log_to_db' LIMIT 1"
    );

    // Обработка синхронного и асинхронного результата
    const handleResult = (res) => {
      if (res.rows && res.rows.length > 0) {
        const val = res.rows[0].value;
        // Значение может быть JSONB boolean или строкой
        _logToDbCache.value = (val === true || val === 'true' || val === '"true"');
      } else {
        _logToDbCache.value = false;
      }
      _logToDbCache.lastCheck = now;
      return _logToDbCache.value;
    };

    if (result && typeof result.then === 'function') {
      // На основе промисов (асинхронно)
      result.then(handleResult).catch(() => {
        _logToDbCache.value = false;
        _logToDbCache.lastCheck = now;
      });
      return _logToDbCache.value; // Возвращаем кэшированное значение (обновится позже)
    } else {
      // Синхронно
      return handleResult(result);
    }
  } catch {
    _logToDbCache.value = false;
    _logToDbCache.lastCheck = now;
    return false;
  }
}

/**
 * Запись лога в базу данных (неблокирующая)
 */
function writeLogToDb(level, source, message, details = null, userId = null) {
  if (!isLogToDbEnabled()) return;

  try {
    const db = require('../db');
    db.query(
      'INSERT INTO system_logs (level, source, message, details, user_id) VALUES ($1, $2, $3, $4, $5)',
      [level, source, message, details ? JSON.stringify(details) : null, userId]
    ).catch(err => {
      // Логируем в файл при ошибке записи в БД, избегая бесконечного цикла
      console.error('Не удалось записать лог в базу данных:', err.message);
    });
  } catch {
    // Ошибки игнорируются - фолбэк на файловое логирование
  }
}

// Чувствительные поля, которые не должны попадать в логи
const SENSITIVE_FIELDS = [
  'password',
  'passwordHash',
  'password_hash',
  'token',
  'accessToken',
  'refreshToken',
  'apiKey',
  'api_key',
  'secret',
  'authorization',
  'cookie',
  'sessionId',
  'csrf',
  'ssn',
  'creditCard',
  'cvv'
];

/**
 * Рекурсивное удаление чувствительных полей из объекта
 */
const sanitizeData = (data) => {
  if (!data || typeof data !== 'object') {
    return data;
  }

  if (Array.isArray(data)) {
    return data.map(item => sanitizeData(item));
  }

  const sanitized = {};
  for (const [key, value] of Object.entries(data)) {
    const lowerKey = key.toLowerCase();
    const isSensitive = SENSITIVE_FIELDS.some(field => 
      lowerKey.includes(field.toLowerCase())
    );

    if (isSensitive) {
      sanitized[key] = '***REDACTED***';
    } else if (value !== null && typeof value === 'object') {
      sanitized[key] = sanitizeData(value);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
};

/**
 * Форматирование метаданных для лога
 */
const formatMetadata = (metadata) => {
  if (!metadata || Object.keys(metadata).length === 0) {
    return '';
  }
  
  const sanitized = sanitizeData(metadata);
  return '\n' + JSON.stringify(sanitized, null, 2);
};

/**
 * Получение уровня логирования из окружения
 */
const getLogLevel = () => {
  const level = (process.env.LOG_LEVEL || 'info').toLowerCase();
  const levels = { debug: 0, info: 1, warn: 2, error: 3 };
  return levels[level] !== undefined ? levels[level] : 1;
};

const LOG_LEVELS = { debug: 0, info: 1, warn: 2, error: 3 };
const currentLogLevel = getLogLevel();

/**
 * Проверка, нужно ли логировать сообщение данного уровня
 */
const shouldLog = (level) => {
  return LOG_LEVELS[level] >= currentLogLevel;
};

/**
 * Централизованный logger для всего приложения
 */
const logger = {
  /**
   * Логирование ошибок
   * @param {string} message - Сообщение об ошибке
   * @param {Error|Object|null} errorOrMeta - Объект ошибки или метаданные
   */
  error: (message, errorOrMeta = null) => {
    if (!shouldLog('error')) return;

    const timestamp = new Date().toISOString();
    let errorDetails = '';

    if (errorOrMeta) {
      if (errorOrMeta instanceof Error) {
        errorDetails = '\n' + errorOrMeta.stack;
      } else if (typeof errorOrMeta === 'object') {
        errorDetails = formatMetadata(errorOrMeta);
      } else {
        errorDetails = '\n' + String(errorOrMeta);
      }
    }

    const logMessage = `[${timestamp}] ERROR: ${message}${errorDetails}\n`;

    const logFile = path.join(logsDir, `error-${new Date().toISOString().split('T')[0]}.log`);
    fs.appendFile(logFile, logMessage, (err) => {
      if (err) console.error('Ошибка записи error-лога:', err.message);
    });
    console.error(logMessage);

    // Запись в БД, если включена
    writeLogToDb('error', 'backend', message, errorOrMeta);
  },

  /**
   * Логирование информационных сообщений
   * @param {string} message - Информационное сообщение
   * @param {Object} metadata - Дополнительные данные (опционально)
   */
  info: (message, metadata = null) => {
    if (!shouldLog('info')) return;

    const timestamp = new Date().toISOString();
    const metaStr = metadata ? formatMetadata(metadata) : '';
    const logMessage = `[${timestamp}] INFO: ${message}${metaStr}\n`;

    const logFile = path.join(logsDir, `info-${new Date().toISOString().split('T')[0]}.log`);
    fs.appendFile(logFile, logMessage, (err) => {
      if (err) console.error('Ошибка записи info-лога:', err.message);
    });
    console.log(logMessage);

    // Запись в БД, если включена
    writeLogToDb('info', 'backend', message, metadata);
  },

  /**
   * Логирование предупреждений
   * @param {string} message - Предупреждающее сообщение
   * @param {Object} metadata - Дополнительные данные (опционально)
   */
  warn: (message, metadata = null) => {
    if (!shouldLog('warn')) return;

    const timestamp = new Date().toISOString();
    const metaStr = metadata ? formatMetadata(metadata) : '';
    const logMessage = `[${timestamp}] WARN: ${message}${metaStr}\n`;

    const logFile = path.join(logsDir, `warn-${new Date().toISOString().split('T')[0]}.log`);
    fs.appendFile(logFile, logMessage, (err) => {
      if (err) console.error('Ошибка записи warn-лога:', err.message);
    });
    console.warn(logMessage);

    // Запись в БД, если включена
    writeLogToDb('warn', 'backend', message, metadata);
  },

  /**
   * Логирование отладочной информации
   * @param {string} message - Отладочное сообщение
   * @param {Object} metadata - Дополнительные данные (опционально)
   */
  debug: (message, metadata = null) => {
    if (!shouldLog('debug')) return;

    const timestamp = new Date().toISOString();
    const metaStr = metadata ? formatMetadata(metadata) : '';
    const logMessage = `[${timestamp}] DEBUG: ${message}${metaStr}\n`;

    const logFile = path.join(logsDir, `debug-${new Date().toISOString().split('T')[0]}.log`);
    
    // Асинхронная запись в файл
    fs.appendFile(logFile, logMessage, (err) => {
      if (err) console.error('Ошибка записи debug-лога:', err.message);
    });
    
    console.log(logMessage);

    // Запись в БД, если включена
    writeLogToDb('debug', 'backend', message, metadata);
  },

  /**
   * Логирование HTTP запроса
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   * @param {number} duration - Время выполнения запроса в ms
   */
  http: (req, res, duration) => {
    const metadata = {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      userId: req.headers['x-user-id'] || null,
      ip: req.ip || req.connection?.remoteAddress || null,
      userAgent: req.headers['user-agent'] || null,
    };

    // Добавляем query params если есть
    if (req.query && Object.keys(req.query).length > 0) {
      metadata.query = req.query;
    }

    // Добавляем body для POST/PUT/PATCH (кроме больших файлов)
    if (['POST', 'PUT', 'PATCH'].includes(req.method) && req.body) {
      const bodySize = JSON.stringify(req.body).length;
      if (bodySize < 10000) { // Ограничение 10KB
        metadata.body = req.body;
      } else {
        metadata.bodySize = `${Math.round(bodySize / 1024)}KB (too large, skipped)`;
      }
    }

    const message = `${req.method} ${req.path} ${res.statusCode} - ${duration}ms`;
    
    if (res.statusCode >= 500) {
      logger.error(message, metadata);
    } else if (res.statusCode >= 400) {
      logger.warn(message, metadata);
    } else {
      logger.info(message, metadata);
    }
  }
};

// Экспорт дополнительных функций для Admin API
logger.isLogToDbEnabled = isLogToDbEnabled;
logger.clearCache = () => { _logToDbCache = { value: false, lastCheck: 0 }; };

module.exports = logger;
