/**
 * Сервис синхронизации сотрудников с пользователями и контрагентами
 */

const db = require('../../../db');
const logger = require('../../../utils/logger');
const bcrypt = require('bcrypt');

/**
 * Синхронизировать роль пользователя с должностями
 * @param {Object} params - { user_id, position_ids }
 */
async function syncUserRole({ user_id, position_ids }) {
  if (!user_id || !position_ids || position_ids.length === 0) return;

  // Получаем роли всех должностей, приоритет — is_primary
  const { rows: posRows } = await db.query(`
    SELECT p.role, ep.is_primary
    FROM positions p
    JOIN employee_positions ep ON ep.position_id = p.id
    WHERE ep.position_id = ANY($1) AND p.role IS NOT NULL
    ORDER BY ep.is_primary DESC, ep.created_at ASC
    LIMIT 1
  `, [position_ids]);

  if (!posRows.length) return;

  const targetRole = posRows[0].role;

  // Обновляем роль пользователя
  await db.query(
    'UPDATE users SET role = $1 WHERE id = $2',
    [targetRole, user_id]
  );
  logger.info(`[administration] Role synced: user ${user_id} -> role ${targetRole}`);
}

/**
 * Синхронизировать данные сотрудника и пользователя
 * @param {Object} params - { employee_id, user_id, full_name, phone, email_work }
 */
async function syncEmployeeUser({ user_id, full_name, phone, email_work }) {
  if (!user_id) return;

  await db.query(
    `UPDATE users SET name = $1, phone = $2, email = COALESCE($3, email)
     WHERE id = $4 AND (name IS DISTINCT FROM $1 OR phone IS DISTINCT FROM $2)`,
    [full_name, phone || null, email_work || null, user_id]
  );
}

/**
 * Синхронизировать сотрудника с контрагентом
 * @param {Object} params - { contractor_id, full_name, phone, email_work, employment_status }
 * @returns {Promise<number>} - ID контрагента
 */
async function syncContractor({ contractor_id, full_name, phone, email_work, employment_status }) {
  const isActive = employment_status === 'active' || employment_status === 'vacation' || employment_status === 'maternity';
  const contractorStatus = isActive ? 'active' : 'inactive';

  if (contractor_id) {
    await db.query(`
      UPDATE contractors
      SET name=$1, phone=$2, email=$3, status=$4, is_employee=TRUE, type='employee'
      WHERE id=$5
    `, [full_name, phone || null, email_work || null, contractorStatus, contractor_id]);
    return contractor_id;
  } else {
    const { rows } = await db.query(`
      INSERT INTO contractors (name, phone, email, type, status, is_employee)
      VALUES ($1, $2, $3, 'employee', $4, TRUE)
      RETURNING id
    `, [full_name, phone || null, email_work || null, contractorStatus]);
    return rows[0].id;
  }
}

/**
 * Автоматическое создание пользователя для сотрудника
 * @param {string} full_name 
 * @param {string} email 
 * @param {string} phone 
 * @param {string} role 
 * @returns {Promise<string>} - ID нового пользователя
 */
async function autoCreateUser(full_name, email, phone, role) {
  const newUserId = 'user-' + Date.now();
  const initials = full_name.trim().split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'U';
  const passwordHash = await bcrypt.hash('password123', 10);

  await db.query(
    `INSERT INTO users (id, name, email, phone, role, status, initials, password_hash)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [newUserId, full_name.trim(), email || null, phone || null, role || 'user', 'active', initials, passwordHash]
  );
  
  return newUserId;
}

module.exports = {
  syncUserRole,
  syncEmployeeUser,
  syncContractor,
  autoCreateUser
};
