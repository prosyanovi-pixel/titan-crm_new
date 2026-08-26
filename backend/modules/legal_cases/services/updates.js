/**
 * Сервис для управления обновлениями записей дел (для модуля Lawyers)
 */

const db = require('../../../db');
const logger = require('../../../utils/logger');

/**
 * Получить необходимо просмотренные обновления для дела
 * @param {string} caseId - ID дела
 * @param {string} viewedBy - ID пользователя (опционально)
 * @returns {Promise<Array>} Список непросмотренных обновлений
 */
async function getUnviewedUpdates(caseId, viewedBy = null) {
  try {
    let query = 'SELECT * FROM case_record_updates WHERE case_id = $1 AND is_viewed = false';
    const params = [caseId];

    if (viewedBy) {
      query += ' AND viewed_by IS DISTINCT FROM $2';
      params.push(viewedBy);
    }

    const { rows } = await db.query(query + ' ORDER BY created_at DESC', params);
    return rows;
  } catch (err) {
    logger.error('[UPDATES SERVICE] Error getting unviewed updates:', err);
    throw err;
  }
}

/**
 * Отметить обновление как просмотренное
 * @param {string} updateId - ID обновления
 * @param {string} viewedBy - ID пользователя который просмотрел
 * @returns {Promise<Object>} Обновленное обновление
 */
async function markAsViewed(updateId, viewedBy) {
  try {
    const { rows } = await db.query(
      `UPDATE case_record_updates 
       SET is_viewed = true, viewed_at = CURRENT_TIMESTAMP, viewed_by = $2
       WHERE id = $1
       RETURNING *`,
      [updateId, viewedBy]
    );

    if (rows.length > 0) {
      logger.info('[UPDATES SERVICE] Update marked as viewed:', updateId);
    }

    return rows[0];
  } catch (err) {
    logger.error('[UPDATES SERVICE] Error marking update as viewed:', err);
    throw err;
  }
}

/**
 * Отметить все обновления дела как просмотренные
 * @param {string} caseId - ID дела
 * @param {string} viewedBy - ID пользователя который просмотрел
 * @returns {Promise<Array>} Список отмеченных обновлений
 */
async function markAllCaseUpdatesAsViewed(caseId, viewedBy) {
  try {
    const { rows } = await db.query(
      `UPDATE case_record_updates 
       SET is_viewed = true, viewed_at = CURRENT_TIMESTAMP, viewed_by = $2
       WHERE case_id = $1 AND is_viewed = false
       RETURNING *`,
      [caseId, viewedBy]
    );

    logger.info('[UPDATES SERVICE] Marked case updates as viewed:', {
      caseId,
      count: rows.length,
      viewedBy
    });

    return rows;
  } catch (err) {
    logger.error('[UPDATES SERVICE] Error marking case updates as viewed:', err);
    throw err;
  }
}

/**
 * Создать обновление для дела
 * @param {Object} updateData - Данные обновления
 * @returns {Promise<Object>} Созданное обновление
 */
async function createCaseUpdate(updateData) {
  try {
    const {
      case_id,
      lawyer_id,
      update_type = 'case_update',
      title,
      description,
    } = updateData;

    const { rows } = await db.query(
      `INSERT INTO case_record_updates 
       (case_id, lawyer_id, update_type, title, description, is_viewed)
       VALUES ($1, $2, $3, $4, $5, false)
       RETURNING *`,
      [case_id, lawyer_id, update_type, title, description]
    );

    logger.info('[UPDATES SERVICE] Case update created:', {
      updateId: rows[0].id,
      caseId: case_id,
      type: update_type
    });

    return rows[0];
  } catch (err) {
    logger.error('[UPDATES SERVICE] Error creating case update:', err);
    throw err;
  }
}

/**
 * Удалить обновление
 * @param {string} updateId - ID обновления
 * @returns {Promise<boolean>} Успешно ли удалено
 */
async function deleteUpdate(updateId) {
  try {
    const { rows } = await db.query(
      'DELETE FROM case_record_updates WHERE id = $1 RETURNING id',
      [updateId]
    );

    if (rows.length > 0) {
      logger.info('[UPDATES SERVICE] Update deleted:', updateId);
      return true;
    }
    return false;
  } catch (err) {
    logger.error('[UPDATES SERVICE] Error deleting update:', err);
    throw err;
  }
}

/**
 * Удалить все обновления дела
 * @param {string} caseId - ID дела
 * @returns {Promise<number>} Количество удаленных обновлений
 */
async function deleteAllCaseUpdates(caseId) {
  try {
    const { rows } = await db.query(
      'DELETE FROM case_record_updates WHERE case_id = $1 RETURNING id',
      [caseId]
    );

    logger.info('[UPDATES SERVICE] All case updates deleted:', {
      caseId,
      count: rows.length
    });

    return rows.length;
  } catch (err) {
    logger.error('[UPDATES SERVICE] Error deleting all case updates:', err);
    throw err;
  }
}

module.exports = {
  getUnviewedUpdates,
  markAsViewed,
  markAllCaseUpdatesAsViewed,
  createCaseUpdate,
  deleteUpdate,
  deleteAllCaseUpdates,
};
