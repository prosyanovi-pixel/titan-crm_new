/**
 * Сервис управления ролями и правами
 */

const db = require('../../../db');

/**
 * Получить все роли с количеством пользователей
 * @returns {Promise<Array>}
 */
async function getAllRoles() {
  const { rows } = await db.query('SELECT * FROM roles ORDER BY name');

  for (let role of rows) {
    const countRes = await db.query('SELECT COUNT(*) FROM users WHERE role = $1', [role.id]);
    role.userCount = parseInt(countRes.rows[0].count);
    
    if (typeof role.permissions === 'string') {
      try {
        role.permissions = JSON.parse(role.permissions);
      } catch (e) {
        role.permissions = [];
      }
    }
  }

  return rows;
}

/**
 * Создать новую роль
 * @param {Object} roleData - Данные роли
 * @returns {Promise<Object>}
 */
async function createRole(roleData) {
  const { name, description, permissions } = roleData;
  const id = name.toLowerCase().replace(/\s+/g, '_') + '_' + Date.now();
  
  const { rows } = await db.query(
    `INSERT INTO roles (id, name, description, permissions)
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [id, name, description, JSON.stringify(permissions || [])]
  );
  
  let perms = rows[0].permissions;
  if (typeof perms === 'string') {
    try { perms = JSON.parse(perms); } catch (e) { perms = []; }
  }

  return { ...rows[0], permissions: perms, userCount: 0 };
}

/**
 * Обновить роль
 * @param {string} id - ID роли
 * @param {Object} roleData - Новые данные
 * @returns {Promise<Object>}
 */
async function updateRole(id, roleData) {
  const { name, description, permissions } = roleData;
  
  const { rows } = await db.query(
    `UPDATE roles SET name=$1, description=$2, permissions=$3, updated_at=CURRENT_TIMESTAMP WHERE id=$4 RETURNING *`,
    [name, description, JSON.stringify(permissions || []), id]
  );
  
  if (rows.length === 0) return null;

  const countRes = await db.query('SELECT COUNT(*) FROM users WHERE role = $1', [id]);
  const userCount = parseInt(countRes.rows[0].count);
  
  let perms = rows[0].permissions;
  if (typeof perms === 'string') {
    try { perms = JSON.parse(perms); } catch (e) { perms = []; }
  }

  return { ...rows[0], permissions: perms, userCount };
}

/**
 * Удалить роль
 * @param {string} id - ID роли
 */
async function deleteRole(id) {
  const check = await db.query('SELECT id FROM users WHERE role = $1 LIMIT 1', [id]);
  if (check.rows.length > 0) {
    throw new Error('Невозможно удалить роль, назначенную пользователям');
  }

  await db.query('DELETE FROM roles WHERE id = $1', [id]);
}

/**
 * Получить все доступные разрешения
 * @returns {Promise<Array>}
 */
async function getAllPermissions() {
  const { rows } = await db.query('SELECT * FROM permissions ORDER BY category, name');
  return rows;
}

module.exports = {
  getAllRoles,
  createRole,
  updateRole,
  deleteRole,
  getAllPermissions
};
