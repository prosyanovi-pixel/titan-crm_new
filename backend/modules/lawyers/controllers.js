/**
 * Контроллеры модуля Lawyers
 * Обработчики HTTP-запросов для управления юристами
 */

const { asyncHandler } = require('../../utils/errorHandler');
const { sendSuccess, sendCreated, sendNotFound, sendValidationError } = require('../../utils/responseHelpers');
const db = require('../../db');

/**
 * Маппинг пользователя в объект юриста
 * @param {Object} u - Объект пользователя или сотрудника из БД
 * @returns {Object} Объект юриста с дополнительными полями
 */
const mapToLawyer = (u) => {
  const isEmployee = String(u.id || '').startsWith('emp-') || !!u.employeeId;
  
  return {
    ...u,
    id: u.id || (u.employeeId ? `emp-${u.employeeId}` : u.userId),
    name: u.name || u.fullName || 'Неизвестный',
    fullName: u.fullName || u.name || '',
    activeCasesCount: 5, // Заглушка, в будущем можно загружать из БД
    wonCasesCount: 12,
    rating: parseFloat(u.rating) || 0,
    // Конвертация специализаций из строки в массив
    specializations: Array.isArray(u.specializations)
      ? u.specializations
      : u.specializations
      ? String(u.specializations).split(',').map(s => s.trim()).filter(Boolean)
      : [],
    hourlyRate: parseFloat(u.hourlyRate || u.salary || 0),
    status: u.status || u.userStatus || u.employmentStatus || 'active',
    telegramId: u.telegramId || u.telegramToken || '',
    notes: u.notes || '',
    source: isEmployee ? 'employee' : 'user',
  };
};

/**
 * Получить всех юристов
 * @route GET /api/lawyers
 * @returns {Array} Список юристов (users с ролью 'Юрист' + employees с должностью 'Юрист')
 */
async function getAll(req, res) {
  // 1. Получаем пользователей с ролью «Юрист»
  const { rows: userRows } = await db.query(
    "SELECT * FROM users WHERE role = $1 ORDER BY name",
    ['Юрист']
  );

  // 2. Получаем сотрудников с должностью «Юрист» (через employee_positions)
  const { rows: employeeRows } = await db.query(`
    SELECT
      e.id AS employee_id,
      e.full_name,
      e.phone,
      e.email_work AS email,
      e.telegram_id,
      e.hire_date,
      e.fire_date,
      e.salary AS hourly_rate,
      e.employment_status AS status,
      e.notes,
      u.id AS user_id,
      u.role AS user_role,
      u.status AS user_status,
      u.avatar,
      u.initials,
      p.name AS position_name
    FROM employees e
    LEFT JOIN users u ON u.id = e.user_id
    LEFT JOIN employee_positions ep ON ep.employee_id = e.id
    LEFT JOIN positions p ON p.id = ep.position_id
    WHERE p.name = 'Юрист' AND e.fire_date IS NULL
    ORDER BY e.full_name
  `);

  // 3. Объединяем (исключая дубликаты: если есть сотрудник с user_id, отдаём предпочтение сотруднику)
  const employeeUserIds = new Set(employeeRows.map(r => r.userId).filter(Boolean));
  
  const uniqueUsers = userRows.filter(u => !employeeUserIds.has(u.id));

  const allLawyers = [
    ...uniqueUsers.map(u => ({ ...u, source: 'user' })),
    ...employeeRows.map(r => ({
      ...r,
      id: `emp-${r.employeeId}`,
      name: r.fullName,
      source: 'employee',
    })),
  ];

  const lawyers = allLawyers.map(mapToLawyer);
  sendSuccess(res, lawyers);
}

/**
 * Получить юриста по ID
 * @route GET /api/lawyers/:id
 * @param {string} req.params.id - ID юриста (может быть с префиксом emp-)
 * @returns {Object} Юрист с дополнительными полями
 */
async function getById(req, res) {
  const { id } = req.params;
  let lawyerData;

  if (id.startsWith('emp-')) {
    const empId = id.replace('emp-', '');
    const { rows } = await db.query(`
      SELECT e.*, e.id as employee_id, e.full_name, e.email_work as email, e.salary as hourly_rate, 
             u.role as user_role, u.avatar, u.initials, p.name as position_name
      FROM employees e
      LEFT JOIN users u ON u.id = e.user_id
      LEFT JOIN employee_positions ep ON ep.employee_id = e.id
      LEFT JOIN positions p ON p.id = ep.position_id
      WHERE e.id = $1
    `, [empId]);
    lawyerData = rows[0];
  } else {
    const { rows } = await db.query(
      "SELECT * FROM users WHERE id = $1",
      [id]
    );
    lawyerData = rows[0];
  }

  if (!lawyerData) {
    return sendNotFound(res, 'Lawyer not found');
  }

  const lawyer = mapToLawyer(lawyerData);
  sendSuccess(res, lawyer);
}

/**
 * Создать юриста
 * @route POST /api/lawyers
 * @param {Object} req.body - Данные юриста
 * @returns {Object} Созданный юрист
 */
async function create(req, res) {
  const { name, email, phone, status, specializations, rating, hourlyRate, telegramId, notes } = req.body;

  // Валидация обязательных полей
  if (!name || !email) {
    return sendValidationError(res, 'Name and email are required');
  }

  const id = 'user-' + Math.floor(Math.random() * 10000);
  // Конвертация специализаций из массива в строку
  const specializationsStr = Array.isArray(specializations)
    ? specializations.join(',')
    : specializations || '';

  const { rows } = await db.query(
    `INSERT INTO users (id, name, email, phone, status, role, department, initials, specializations, rating, hourly_rate, telegram_token, notes)
     VALUES ($1, $2, $3, $4, $5, 'Юрист', 'Legal', $6, $7, $8, $9, $10, $11) RETURNING *`,
    [
      id,
      name,
      email,
      phone,
      status || 'active',
      name.substring(0, 2).toUpperCase(),
      specializationsStr,
      rating || 0,
      hourlyRate || 0,
      telegramId || '',
      notes || ''
    ]
  );

  const lawyer = mapToLawyer(rows[0]);
  sendCreated(res, lawyer);
}

/**
 * Обновить юриста
 * @route PUT /api/lawyers/:id
 * @param {string} req.params.id - ID юриста (может быть с префиксом emp-)
 * @param {Object} req.body - Обновлённые данные
 * @returns {Object} Обновлённый юрист
 */
async function update(req, res) {
  const { id } = req.params;
  const { name, fullName, email, phone, status, specializations, rating, hourlyRate, telegramId, notes } = req.body;

  if (id.startsWith('emp-')) {
    const empId = id.replace('emp-', '');
    
    // Проверка существования
    const { rows: checkRows } = await db.query("SELECT * FROM employees WHERE id = $1", [empId]);
    if (checkRows.length === 0) return sendNotFound(res, 'Employee lawyer not found');
    
    const current = checkRows[0];
    
    // Обновляем сотрудника
    const { rows } = await db.query(
      `UPDATE employees SET
          full_name = $1, email_work = $2, phone = $3, employment_status = $4,
          salary = $5, telegram_id = $6, notes = $7, updated_at = NOW()
       WHERE id = $8
       RETURNING *`,
      [
        fullName || name || current.fullName,
        email || current.emailWork,
        phone || current.phone,
        status || current.employmentStatus,
        hourlyRate !== undefined ? hourlyRate : current.salary,
        telegramId !== undefined ? telegramId : current.telegramId,
        notes !== undefined ? notes : current.notes,
        empId
      ]
    );
    
    // Если есть привязанный пользователь, можно обновить и его (опционально)
    if (current.userId) {
        await db.query(
            "UPDATE users SET name = $1, email = $2, phone = $3 WHERE id = $4",
            [name || current.fullName, email || current.emailWork, phone || current.phone, current.userId]
        );
    }

    const lawyer = mapToLawyer(rows[0]);
    return sendSuccess(res, lawyer);
  } 

  // Для обычных пользователей
  const { rows: checkRows } = await db.query("SELECT * FROM users WHERE id = $1", [id]);
  if (checkRows.length === 0) return sendNotFound(res, 'User lawyer not found');
  
  const current = checkRows[0];
  const specializationsStr = Array.isArray(specializations)
    ? specializations.join(',')
    : specializations !== undefined ? specializations : current.specializations;

  const { rows } = await db.query(
    `UPDATE users SET
        name = $1, email = $2, phone = $3, status = $4,
        specializations = $5, rating = $6, hourly_rate = $7,
        telegram_token = $8, notes = $9
     WHERE id = $10
     RETURNING *`,
    [
      name || current.name,
      email || current.email,
      phone || current.phone,
      status || current.status,
      specializationsStr,
      rating !== undefined ? rating : current.rating,
      hourlyRate !== undefined ? hourlyRate : (current.hourlyRate || current.hourly_rate),
      telegramId !== undefined ? telegramId : (current.telegramToken || current.telegram_token),
      notes !== undefined ? notes : current.notes,
      id
    ]
  );

  const lawyer = mapToLawyer(rows[0]);
  sendSuccess(res, lawyer);
}

/**
 * Удалить юриста
 * @route DELETE /api/lawyers/:id
 * @param {string} req.params.id - ID юриста (может быть с префиксом emp-)
 */
async function remove(req, res) {
  const { id } = req.params;
  
  if (id.startsWith('emp-')) {
    const empId = id.replace('emp-', '');
    await db.query('DELETE FROM employees WHERE id = $1', [empId]);
  } else {
    await db.query('DELETE FROM users WHERE id = $1', [id]);
  }
  
  sendSuccess(res, { success: true, message: 'Lawyer deleted' });
}

module.exports = {
  getAll,
  getById,
  create,
  update,
  remove,
};
