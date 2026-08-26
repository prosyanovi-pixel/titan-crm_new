/**
 * Logs Service - handles system logging operations
 */
const db = require('../../../db');
const logger = require('../../../utils/logger');

/**
 * Create a new log entry in the database
 */
async function createLog(level, source, message, details, userId) {
  try {
    await db.query(
      `INSERT INTO system_logs (level, source, message, details, user_id)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        level || 'info',
        source || 'frontend',
        message,
        details ? JSON.stringify(details) : null,
        userId || null
      ]
    );

    // Also log to console for immediate visibility during dev
    const prefix = source === 'frontend' ? '[FE]' : '[BE]';
    if (level === 'error') {
      logger.error(prefix + ' ' + message, details);
    } else {
      logger.info(prefix + ' ' + message, details);
    }

    return { success: true };
  } catch (err) {
    logger.error('Failed to write log', err);
    throw err;
  }
}

/**
 * Get system logs (for admin panel)
 */
async function getLogs(limit = 100) {
  try {
    const { rows } = await db.query(
      'SELECT * FROM system_logs ORDER BY created_at DESC LIMIT $1',
      [limit]
    );
    return rows;
  } catch (err) {
    logger.error('Failed to retrieve logs', err);
    throw err;
  }
}

/**
 * Get logs filtered by level and source
 */
async function getFilteredLogs(level = null, source = null, limit = 100) {
  try {
    let query = 'SELECT * FROM system_logs WHERE 1=1';
    const params = [];

    if (level) {
      params.push(level);
      query += ` AND level = $${params.length}`;
    }

    if (source) {
      params.push(source);
      query += ` AND source = $${params.length}`;
    }

    params.push(limit);
    query += ` ORDER BY created_at DESC LIMIT $${params.length}`;

    const { rows } = await db.query(query, params);
    return rows;
  } catch (err) {
    logger.error('Failed to retrieve filtered logs', err);
    throw err;
  }
}

/**
 * Clear old logs (older than X days)
 */
async function clearOldLogs(daysOld = 30) {
  try {
    const result = await db.query(
      'DELETE FROM system_logs WHERE created_at < NOW() - INTERVAL \'1 day\' * $1',
      [daysOld]
    );
    logger.info(`Cleared logs older than ${daysOld} days`, { deletedCount: result.rowCount });
    return { success: true, deletedCount: result.rowCount };
  } catch (err) {
    logger.error('Failed to clear old logs', err);
    throw err;
  }
}

module.exports = {
  createLog,
  getLogs,
  getFilteredLogs,
  clearOldLogs,
};
