const db = require('../db');
const logger = require('./logger');

/**
 * Логгирование действий пользователя
 * @param {Object} params
 * @param {string} params.userId - ID пользователя
 * @param {string} params.action - Действие (например, 'CREATE', 'UPDATE', 'DELETE')
 * @param {string} params.entityType - Тип сущности (например, 'contractor', 'project')
 * @param {string} params.entityId - ID сущности
 * @param {Object} [params.oldData] - Старые данные (для UPDATE/DELETE)
 * @param {Object} [params.newData] - Новые данные (для CREATE/UPDATE)
 * @param {string} [params.ipAddress] - IP адрес
 * @param {string} [params.userAgent] - User Agent
 */
async function logAction({
  userId,
  action,
  entityType,
  entityId,
  oldData,
  newData,
  ipAddress,
  userAgent
}) {
  try {
    await db.query(
      `INSERT INTO audit_log (
        user_id, action, entity_type, entity_id, 
        old_data, new_data, ip_address, user_agent
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        userId,
        action,
        entityType,
        entityId,
        oldData ? JSON.stringify(oldData) : null,
        newData ? JSON.stringify(newData) : null,
        ipAddress,
        userAgent
      ]
    );
  } catch (err) {
    logger.error('Failed to write to audit_log:', err);
    // Не выбрасываем ошибку, чтобы не прерывать основной процесс
  }
}

module.exports = {
  logAction
};
