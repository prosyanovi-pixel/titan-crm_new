/**
 * Сервис управления сотрудниками
 */

const db = require('../../../db');
const logger = require('../../../utils/logger');
const employeeSync = require('./employeeSync');

/**
 * Обогащение сотрудников массивом должностей
 */
async function enrichWithPositions(employees) {
  try {
    if (employees.length === 0) return employees;

    const employeeIds = employees.map(e => e.id);
    const { rows: posRows } = await db.query(`
      SELECT ep.employee_id AS emp_id, ep.is_primary,
             p.id AS pos_id, p.name AS pos_name, p.role AS pos_role
      FROM employee_positions ep
      JOIN positions p ON p.id = ep.position_id
      WHERE ep.employee_id = ANY($1)
      ORDER BY ep.employee_id, ep.is_primary DESC
    `, [employeeIds]);

    const posMap = {};
    posRows.forEach(pr => {
      const empId = pr.emp_id || pr.empId;
      if (!empId) return;
      if (!posMap[empId]) posMap[empId] = [];
      posMap[empId].push({
        position_id: pr.pos_id || pr.posId,
        position_name: pr.pos_name || pr.posName,
        position_role: pr.pos_role || pr.posRole,
        is_primary: pr.is_primary || pr.isPrimary,
      });
    });

    return employees.map(e => ({
      ...e,
      positions: posMap[e.id] || [],
    }));
  } catch (err) {
    logger.warn('[administration] enrichWithPositions failed (possibly table missing):', err.message);
    return employees;
  }
}

/**
 * Обновить связи должностей сотрудника
 */
async function updateEmployeePositions(employeeId, positionIds, primaryPositionId) {
  await db.query('DELETE FROM employee_positions WHERE employee_id = $1', [employeeId]);
  if (!positionIds || positionIds.length === 0) return;

  for (let idx = 0; idx < positionIds.length; idx++) {
    const pid = positionIds[idx];
    const isPrimary = pid === primaryPositionId || (idx === 0 && !primaryPositionId);
    await db.query(
      `INSERT INTO employee_positions (employee_id, position_id, is_primary)
       VALUES ($1, $2, $3)
       ON CONFLICT (employee_id, position_id) DO UPDATE SET is_primary = EXCLUDED.is_primary`,
      [employeeId, pid, isPrimary]
    );
  }
}

/**
 * Список сотрудников
 */
async function getAllEmployees(filters = {}) {
  const { status, department_id, position_id } = filters;
  let where = 'WHERE 1=1';
  const params = [];

  if (status) {
    params.push(status);
    where += ` AND e.employment_status = $${params.length}`;
  }
  if (department_id) {
    params.push(department_id);
    where += ` AND e.department_id = $${params.length}`;
  }
  if (position_id) {
    params.push(position_id);
    where += ` AND e.position_id = $${params.length}`;
  }

  const { rows } = await db.query(`
    SELECT
      e.*,
      p.name  AS position_name,
      d.name  AS department_name,
      u.name  AS user_name,
      u.email AS user_email,
      u.role  AS user_role,
      u.status AS user_status,
      u.avatar AS user_avatar,
      c.name  AS salary_currency_name,
      c.symbol AS salary_currency_symbol
    FROM employees e
    LEFT JOIN positions p ON p.id = e.position_id
    LEFT JOIN departments d ON d.id = e.department_id
    LEFT JOIN users u ON u.id = e.user_id
    LEFT JOIN currency c ON c.id = e.salary_currency
    ${where}
    ORDER BY e.full_name
  `, params);

  return enrichWithPositions(rows);
}

/**
 * Получить сотрудника по ID
 */
async function getEmployeeById(id) {
  const { rows } = await db.query(`
    SELECT
      e.*,
      p.name   AS position_name,
      d.name   AS department_name,
      u.name   AS user_name,
      u.email  AS user_email,
      u.role   AS user_role,
      u.status AS user_status,
      c.name   AS salary_currency_name,
      c.symbol AS salary_currency_symbol
    FROM employees e
    LEFT JOIN positions p ON p.id = e.position_id
    LEFT JOIN departments d ON d.id = e.department_id
    LEFT JOIN users u ON u.id = e.user_id
    LEFT JOIN currency c ON c.id = e.salary_currency
    WHERE e.id = $1
  `, [id]);

  if (!rows.length) return null;
  const enriched = await enrichWithPositions(rows);
  return enriched[0];
}

/**
 * Создать сотрудника
 */
async function createEmployee(data) {
  const {
    full_name, phone, email_work, email_personal, telegram_id,
    position_id, position_ids, department_id, user_id, contractor_id,
    hire_date, birth_date, fire_date, salary, salary_currency,
    payment_type, employment_status, notes,
    create_user, primary_position_id
  } = data;

  let finalUserId = user_id || null;
  const effectivePositionIds = Array.isArray(position_ids) ? position_ids : (position_id ? [position_id] : []);
  const primaryPosId = primary_position_id || effectivePositionIds[0] || null;

  // Авто-создание пользователя
  if (create_user && !user_id) {
    let role = 'user';
    if (primaryPosId) {
      const { rows } = await db.query('SELECT role FROM positions WHERE id = $1', [primaryPosId]);
      if (rows[0]?.role) role = rows[0].role;
    }
    finalUserId = await employeeSync.autoCreateUser(full_name, email_work, phone, role);
  }

  const { rows } = await db.query(`
    INSERT INTO employees
      (full_name, phone, email_work, email_personal, telegram_id,
       position_id, department_id, user_id, contractor_id,
       hire_date, birth_date, fire_date, salary, salary_currency,
       payment_type, employment_status, notes)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
    RETURNING id
  `, [
    full_name.trim(), phone, email_work, email_personal, telegram_id,
    primaryPosId, department_id || null, finalUserId, contractor_id || null,
    hire_date || null, birth_date || null, fire_date || null,
    salary || null, salary_currency || 'RUB',
    payment_type || 'salary', employment_status || 'active', notes
  ]);

  const employeeId = rows[0].id;

  // Позиции
  await updateEmployeePositions(employeeId, effectivePositionIds, primaryPosId);

  // Синхронизация контрагента
  const resContractorId = await employeeSync.syncContractor({
    contractor_id: contractor_id || null,
    full_name: full_name.trim(), phone, email_work, employment_status
  });
  if (resContractorId !== contractor_id) {
    await db.query('UPDATE employees SET contractor_id=$1 WHERE id=$2', [resContractorId, employeeId]);
  }

  // Синхронизация пользователя
  if (finalUserId) {
    if (effectivePositionIds.length > 0) {
      await employeeSync.syncUserRole({ user_id: finalUserId, position_ids: effectivePositionIds });
    }
    await employeeSync.syncEmployeeUser({ user_id: finalUserId, full_name: full_name.trim(), phone, email_work });
  }

  return getEmployeeById(employeeId);
}

/**
 * Обновить сотрудника
 */
async function updateEmployee(id, data) {
  const {
    full_name, phone, email_work, email_personal, telegram_id,
    position_id, position_ids, department_id, user_id, contractor_id,
    hire_date, birth_date, fire_date, salary, salary_currency,
    payment_type, employment_status, notes,
    create_user, primary_position_id
  } = data;

  const current = await getEmployeeById(id);
  if (!current) return null;

  let finalUserId = user_id || current.user_id;
  const effectivePositionIds = Array.isArray(position_ids) ? position_ids : (position_id ? [position_id] : []);
  const primaryPosId = primary_position_id || (effectivePositionIds.length > 0 ? effectivePositionIds[0] : current.position_id);

  // Авто-создание пользователя если нужно
  if (create_user && !finalUserId) {
    let role = 'user';
    if (primaryPosId) {
      const { rows } = await db.query('SELECT role FROM positions WHERE id = $1', [primaryPosId]);
      if (rows[0]?.role) role = rows[0].role;
    }
    finalUserId = await employeeSync.autoCreateUser(full_name, email_work, phone, role);
  }

  await db.query(`
    UPDATE employees SET
      full_name=COALESCE($1, full_name), phone=COALESCE($2, phone), 
      email_work=COALESCE($3, email_work), email_personal=COALESCE($4, email_personal), 
      telegram_id=COALESCE($5, telegram_id), position_id=COALESCE($6, position_id), 
      department_id=COALESCE($7, department_id), user_id=COALESCE($8, user_id), 
      contractor_id=COALESCE($9, contractor_id), hire_date=COALESCE($10, hire_date), 
      birth_date=COALESCE($11, birth_date), fire_date=COALESCE($12, fire_date), 
      salary=COALESCE($13, salary), salary_currency=COALESCE($14, salary_currency),
      payment_type=COALESCE($15, payment_type), employment_status=COALESCE($16, employment_status), 
      notes=COALESCE($17, notes), updated_at=CURRENT_TIMESTAMP
    WHERE id=$18
  `, [
    full_name?.trim(), phone, email_work, email_personal, telegram_id,
    primaryPosId, department_id, finalUserId, contractor_id,
    hire_date, birth_date, fire_date, salary, salary_currency,
    payment_type, employment_status, notes, id
  ]);

  if (position_ids !== undefined) {
    await updateEmployeePositions(id, effectivePositionIds, primaryPosId);
  }

  // Синхронизация
  const resContractorId = await employeeSync.syncContractor({
    contractor_id: contractor_id || current.contractor_id,
    full_name: full_name?.trim() || current.full_name, 
    phone: phone !== undefined ? phone : current.phone, 
    email_work: email_work !== undefined ? email_work : current.email_work, 
    employment_status: employment_status || current.employment_status
  });
  
  if (finalUserId) {
    const posToSync = effectivePositionIds.length > 0 ? effectivePositionIds : (primaryPosId ? [primaryPosId] : []);
    if (posToSync.length > 0) {
      await employeeSync.syncUserRole({ user_id: finalUserId, position_ids: posToSync });
    }
    await employeeSync.syncEmployeeUser({ 
      user_id: finalUserId, 
      full_name: full_name?.trim() || current.full_name, 
      phone: phone !== undefined ? phone : current.phone, 
      email_work: email_work !== undefined ? email_work : current.email_work 
    });
  }

  return getEmployeeById(id);
}

/**
 * Удалить сотрудника
 */
async function deleteEmployee(id) {
  const current = await getEmployeeById(id);
  if (!current) return false;

  await db.query('UPDATE departments SET head_employee_id=NULL WHERE head_employee_id=$1', [id]);
  if (current.contractor_id) {
    await db.query('UPDATE contractors SET is_employee=FALSE, status=$1 WHERE id=$2', ['inactive', current.contractor_id]);
  }
  await db.query('DELETE FROM employees WHERE id=$1', [id]);
  return true;
}

module.exports = {
  getAllEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  deleteEmployee
};
