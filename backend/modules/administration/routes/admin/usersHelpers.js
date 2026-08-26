const db = require('../../../../db');
const logger = require('../../../../utils/logger');

let _adminSchemaEnsured = false;

async function ensureAdminSchema() {
  if (_adminSchemaEnsured) return;
  await db.query(`
    ALTER TABLE users
      ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMP,
      ADD COLUMN IF NOT EXISTS is_blocked     BOOLEAN NOT NULL DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS blocked_at     TIMESTAMP,
      ADD COLUMN IF NOT EXISTS blocked_by     VARCHAR(50),
      ADD COLUMN IF NOT EXISTS block_reason   TEXT;
  `);
  _adminSchemaEnsured = true;
}

async function getUsersList() {
  await ensureAdminSchema();
  const { rows } = await db.query(`
    SELECT DISTINCT ON (u.id)
      u.id, u.name, u.email, u.role, u.status,
      u.is_blocked, u.blocked_at, u.blocked_by, u.block_reason,
      u.last_active_at, u.created_at, u.avatar, u.initials, u.phone, u.department,
      e.id AS employee_id,
      p.name AS position_name,
      d.name AS department_name
    FROM users u
    LEFT JOIN employees   e ON e.user_id = u.id::text
    LEFT JOIN positions   p ON p.id = e.position_id
    LEFT JOIN departments d ON d.id = e.department_id
    ORDER BY u.id, u.last_active_at DESC NULLS LAST
  `);
  return rows;
}

async function blockUser(id, adminId, reason = '') {
  await ensureAdminSchema();
  const { rows } = await db.query(
    `UPDATE users SET is_blocked=TRUE, blocked_at=NOW(), blocked_by=$1, block_reason=$2, status='blocked'
     WHERE id=$3 RETURNING id, name, is_blocked`,
    [adminId || 'system', reason, id]
  );
  if (!rows.length) return null;
  logger.info(`admin: user ${id} blocked by ${adminId}, reason: ${reason}`);
  return rows[0];
}

async function unblockUser(id, adminId) {
  await ensureAdminSchema();
  const { rows } = await db.query(
    `UPDATE users SET is_blocked=FALSE, blocked_at=NULL, blocked_by=NULL, block_reason=NULL, status='active'
     WHERE id=$1 RETURNING id, name, is_blocked`,
    [id]
  );
  if (!rows.length) return null;
  logger.info(`admin: user ${id} unblocked by ${adminId}`);
  return rows[0];
}

module.exports = {
  ensureAdminSchema,
  getUsersList,
  blockUser,
  unblockUser,
};