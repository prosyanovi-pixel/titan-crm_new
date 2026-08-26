/**
 * Бизнес-логика для инстанций дела
 */

const db = require('../../../db');
const logger = require('../../../utils/logger');
const { randomUUID } = require('crypto');

/**
 * Получить все инстанции для конкретного дела
 * @param {string} caseId - ID дела
 * @returns {Promise<Array>}
 */
async function getInstancesByCaseId(caseId) {
  const { rows } = await db.query(
    'SELECT * FROM case_instances WHERE case_id = $1 ORDER BY creation_date ASC',
    [caseId]
  );
  return rows;
}

/**
 * Получить инстанцию по ID
 * @param {string} id - ID инстанции
 * @returns {Promise<Object|null>}
 */
async function getInstanceById(id) {
  const { rows } = await db.query('SELECT * FROM case_instances WHERE id = $1', [id]);
  return rows.length > 0 ? rows[0] : null;
}

/**
 * Создать новую инстанцию
 * @param {Object} data - Данные инстанции
 * @returns {Promise<Object>}
 */
async function createInstance(data) {
  const id = data.id || `inst-${randomUUID()}`;
  
  // Если новая инстанция активна, деактивируем остальные для этого дела
  if (data.is_active || data.isActive) {
    await db.query(
      'UPDATE case_instances SET is_active = false WHERE case_id = $1',
      [data.case_id || data.caseId]
    );
  }

  const { rows } = await db.query(
    `INSERT INTO case_instances (
      id, case_id, instance_type, instance_number, court_name, judge, status, is_active
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
    [
      id,
      data.case_id || data.caseId,
      data.instance_type || data.instanceType,
      data.instance_number || data.instanceNumber,
      data.court_name || data.courtName,
      data.judge,
      data.status || 'new',
      data.is_active || data.isActive || false
    ]
  );

  const result = rows[0];
  result.isNew = true;
  return result;
}

/**
 * Обновить инстанцию
 * @param {string} id - ID инстанции
 * @param {Object} updates - Поля для обновления
 * @returns {Promise<Object|null>}
 */
async function updateInstance(id, updates) {
  const existing = await getInstanceById(id);
  if (!existing) return null;

  // Если инстанция становится активной, деактивируем остальные
  const isActive = updates.is_active !== undefined ? updates.is_active : (updates.isActive !== undefined ? updates.isActive : undefined);
  
  if (isActive === true) {
    await db.query(
      'UPDATE case_instances SET is_active = false WHERE case_id = $1 AND id != $2',
      [existing.caseId || existing.case_id, id]
    );
  }

  const { rows } = await db.query(
    `UPDATE case_instances SET
      instance_type = COALESCE($1, instance_type),
      instance_number = COALESCE($2, instance_number),
      court_name = COALESCE($3, court_name),
      judge = COALESCE($4, judge),
      status = COALESCE($5, status),
      is_active = COALESCE($6, is_active),
      updated_at = CURRENT_TIMESTAMP
    WHERE id = $7 RETURNING *`,
    [
      updates.instance_type || updates.instanceType || null,
      updates.instance_number || updates.instanceNumber || null,
      updates.court_name || updates.courtName || null,
      updates.judge || null,
      updates.status || null,
      isActive !== undefined ? isActive : null,
      id
    ]
  );

  const result = rows[0];
  result.isNew = false;
  return result;
}

/**
 * Удалить инстанцию
 * @param {string} id - ID инстанции
 * @returns {Promise<boolean>}
 */
async function deleteInstance(id) {
  const { rowCount } = await db.query('DELETE FROM case_instances WHERE id = $1', [id]);
  return rowCount > 0;
}

/**
 * Обеспечить наличие инстанции (найти или создать)
 * Используется в Workflow
 */
async function ensureInstance(data) {
  const { case_id, instance_number } = data;
  
  // Ищем существующую инстанцию по номеру и делу
  const { rows } = await db.query(
    'SELECT * FROM case_instances WHERE case_id = $1 AND instance_number = $2',
    [case_id, instance_number]
  );

  if (rows.length > 0) {
    const existing = rows[0];
    // Обновляем только если новые данные не пустые
    const updates = { ...data };
    if (!updates.court_name && !updates.courtName) delete updates.court_name;
    if (!updates.judge) delete updates.judge;
    
    return await updateInstance(existing.id, updates);
  }

  // Создаем новую
  return await createInstance(data);
}

module.exports = {
  getInstancesByCaseId,
  getInstanceById,
  createInstance,
  updateInstance,
  deleteInstance,
  ensureInstance
};
