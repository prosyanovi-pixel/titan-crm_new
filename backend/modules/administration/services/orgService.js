/**
 * Сервис управления оргструктурой (отделы и должности)
 */

const db = require('../../../db');

/**
 * Получить базовую информацию об оргструктуре
 */
async function getOrgInfo() {
  const positions = await db.query('SELECT COUNT(*) as count FROM positions WHERE is_active = TRUE');
  const departments = await db.query('SELECT COUNT(*) as count FROM departments WHERE is_active = TRUE');
  
  return {
    positions: parseInt(positions.rows[0].count) || 0,
    departments: parseInt(departments.rows[0].count) || 0
  };
}

/**
 * Получить все должности
 */
async function getAllPositions() {
  const { rows } = await db.query('SELECT * FROM positions ORDER BY displayorder, id');
  return rows;
}

/**
 * Создать должность
 */
async function createPosition(data) {
  const { name, description = '', displayorder = 0 } = data;
  const { rows } = await db.query(
    `INSERT INTO positions (name, description, displayorder)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [name.trim(), description, displayorder]
  );
  return rows[0];
}

/**
 * Обновить должность
 */
async function updatePosition(id, data) {
  const { name, description = '', displayorder = 0, is_active = true } = data;
  const { rows } = await db.query(
    `UPDATE positions
     SET name=$1, description=$2, displayorder=$3, is_active=$4
     WHERE id=$5
     RETURNING *`,
    [name.trim(), description, displayorder, is_active, id]
  );
  return rows[0] || null;
}

/**
 * Удалить должность
 */
async function deletePosition(id) {
  const { rows: used } = await db.query(
    'SELECT COUNT(*) FROM employees WHERE position_id=$1', [id]
  );
  if (parseInt(used[0].count) > 0) {
    throw new Error('Должность используется сотрудниками');
  }
  await db.query('DELETE FROM positions WHERE id=$1', [id]);
}

/**
 * Получить все отделы
 */
async function getAllDepartments() {
  const { rows } = await db.query(`
    SELECT d.*,
           p.name AS parent_name,
           e.full_name AS head_name
    FROM departments d
    LEFT JOIN departments p ON p.id = d.parent_id
    LEFT JOIN employees e ON e.id = d.head_employee_id
    ORDER BY d.displayorder, d.id
  `);
  return rows;
}

/**
 * Создать отдел
 */
async function createDepartment(data) {
  const { name, description = '', parent_id = null, head_employee_id = null, displayorder = 0 } = data;
  const { rows } = await db.query(
    `INSERT INTO departments (name, description, parent_id, head_employee_id, displayorder)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [name.trim(), description, parent_id || null, head_employee_id || null, displayorder]
  );
  return rows[0];
}

/**
 * Обновить отдел
 */
async function updateDepartment(id, data) {
  const { name, description = '', parent_id = null, head_employee_id = null, displayorder = 0, is_active = true } = data;

  if (parseInt(parent_id) === parseInt(id)) {
    throw new Error('Отдел не может быть своим родителем');
  }

  const { rows } = await db.query(
    `UPDATE departments
     SET name=$1, description=$2, parent_id=$3, head_employee_id=$4, displayorder=$5, is_active=$6
     WHERE id=$7
     RETURNING *`,
    [name.trim(), description, parent_id || null, head_employee_id || null, displayorder, is_active, id]
  );
  return rows[0] || null;
}

/**
 * Удалить отдел
 */
async function deleteDepartment(id) {
  const { rows: used } = await db.query(
    'SELECT COUNT(*) FROM employees WHERE department_id=$1', [id]
  );
  if (parseInt(used[0].count) > 0) {
    throw new Error('Отдел используется сотрудниками');
  }
  await db.query('UPDATE departments SET parent_id=NULL WHERE parent_id=$1', [id]);
  await db.query('DELETE FROM departments WHERE id=$1', [id]);
}

module.exports = {
  getOrgInfo,
  getAllPositions,
  createPosition,
  updatePosition,
  deletePosition,
  getAllDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment
};
