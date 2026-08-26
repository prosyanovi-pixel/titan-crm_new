/**
 * IMAP Validator
 * Валидация параметров перед передачей в IMAP библиотеку
 */

const logger = require('../../../utils/logger');

/**
 * Валидировать IMAP конфиг
 */
function validateImapConfig(config) {
  const errors = [];
  
  if (!config.user) errors.push('IMAP user is required');
  if (!config.password) errors.push('IMAP password is required');
  if (!config.host) errors.push('IMAP host is required');
  if (!config.port) errors.push('IMAP port is required');
  
  if (config.port && typeof config.port !== 'number') {
    errors.push(`IMAP port must be a number, got ${typeof config.port}`);
  }
  
  if (errors.length > 0) {
    throw new Error(`Invalid IMAP config: ${errors.join(', ')}`);
  }
  
  return true;
}

/**
 * Валидировать параметры openBox
 */
function validateOpenBoxParams(boxName, readOnly = false) {
  if (typeof boxName !== 'string') {
    logger.warn(`[ImapValidator] boxName is not string: ${typeof boxName}, converting...`);
    boxName = String(boxName || '');
  }
  
  if (typeof readOnly !== 'boolean') {
    logger.warn(`[ImapValidator] readOnly is not boolean: ${typeof readOnly}`);
    readOnly = Boolean(readOnly);
  }
  
  if (!boxName || boxName.trim().length === 0) {
    throw new Error('Box name cannot be empty');
  }
  
  return { boxName: boxName.trim(), readOnly };
}

/**
 * Валидировать параметры search
 */
function validateSearchParams(criteria) {
  if (!Array.isArray(criteria)) {
    throw new Error('Search criteria must be array');
  }
  
  return criteria;
}

/**
 * Валидировать параметры fetch
 */
function validateFetchOptions(options = {}) {
  const validated = {
    bodies: options.bodies || [''],
    struct: options.struct !== false,
    markSeen: options.markSeen === true,
  };
  
  return validated;
}

/**
 * Безопасно логировать IMAP операцию
 */
function logImapOperation(operation, boxName, details = {}) {
  logger.debug(`[IMAP] ${operation} | box: ${boxName} | ${JSON.stringify(details)}`);
}

/**
 * Оборудать IMAP callback с защитой от ошибок
 */
function safeImapCallback(callback) {
  return (err, result) => {
    if (err) {
      logger.error(`[IMAP] Error: ${err.message}`);
      return callback(err);
    }
    
    return callback(null, result);
  };
}

module.exports = {
  validateImapConfig,
  validateOpenBoxParams,
  validateSearchParams,
  validateFetchOptions,
  logImapOperation,
  safeImapCallback,
};
