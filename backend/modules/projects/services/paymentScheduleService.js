/**
 * Сервис для управления графиком платежей проекта
 * CRUD операции для project_payment_schedule
 */

const db = require('../../../db');

/**
 * Форматирование даты в dd.MM.yyyy
 */
function formatDate(date) {
  if (!date) return null;
  const d = new Date(date);
  if (isNaN(d.getTime())) return null;
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}.${month}.${year}`;
}

/**
 * Парсинг даты из dd.MM.yyyy
 */
function parseDate(dateStr) {
  if (!dateStr) return null;
  if (dateStr.includes('.')) {
    const [day, month, year] = dateStr.split('.');
    return new Date(year, month - 1, day);
  }
  return new Date(dateStr);
}

/**
 * Преобразование платежа
 */
function transformPayment(payment) {
  if (!payment) return payment;
  return {
    ...payment,
    projectId: payment.project_id,
    stageId: payment.stage_id,
    revenueId: payment.revenue_id,
    dueDate: payment.due_date ? formatDate(payment.due_date) : null,
    paidDate: payment.paid_date ? formatDate(payment.paid_date) : null,
    paidAmount: parseFloat(payment.paid_amount) || 0,
    paymentMethod: payment.payment_method,
    overdueSince: payment.overdue_since ? formatDate(payment.overdue_since) : null,
    isEarly: payment.is_early,
    paymentReference: payment.payment_reference,
  };
}

/**
 * Получить все платежи проекта
 */
async function getPaymentSchedule(projectId) {
  const query = `
    SELECT * FROM project_payment_schedule
    WHERE project_id = $1
    ORDER BY due_date, id
  `;
  
  const { rows } = await db.query(query, [projectId]);
  return rows.map(transformPayment);
}

/**
 * Получить платёж по ID
 */
async function getPaymentById(id) {
  const query = 'SELECT * FROM project_payment_schedule WHERE id = $1';
  const { rows } = await db.query(query, [id]);
  
  if (rows.length === 0) return null;
  return transformPayment(rows[0]);
}

/**
 * Создать платёж в графике
 */
async function createPayment(paymentData) {
  const {
    projectId,
    stageId,
    revenueId,
    name,
    description,
    amount,
    currency,
    dueDate,
    paymentMethod,
  } = paymentData;

  // Валидация
  if (!projectId || !name || !amount || !dueDate) {
    throw new Error('Missing required fields: projectId, name, amount, dueDate');
  }

  // Получение следующего ID
  const idRes = await db.query('SELECT COALESCE(MAX(id), 0) + 1 as "nextId" FROM project_payment_schedule');
  const nextId = idRes.rows[0].nextId;

  const query = `
    INSERT INTO project_payment_schedule (
      id, project_id, stage_id, revenue_id, name, description,
      amount, currency, due_date, payment_method, paid_amount
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 0)
    RETURNING *
  `;

  const values = [
    nextId,
    projectId,
    stageId || null,
    revenueId || null,
    name,
    description || null,
    amount,
    currency || 'RUB',
    parseDate(dueDate),
    paymentMethod || 'bank',
  ];

  const { rows } = await db.query(query, values);
  return transformPayment(rows[0]);
}

/**
 * Обновить платёж
 */
async function updatePayment(id, paymentData) {
  const fields = [];
  const values = [];
  let paramIndex = 1;

  const updatableFields = [
    { key: 'name', db: 'name' },
    { key: 'description', db: 'description' },
    { key: 'amount', db: 'amount' },
    { key: 'currency', db: 'currency' },
    { key: 'dueDate', db: 'due_date', isDate: true },
    { key: 'paidAmount', db: 'paid_amount' },
    { key: 'paymentMethod', db: 'payment_method' },
    { key: 'paymentReference', db: 'payment_reference' },
    { key: 'stageId', db: 'stage_id' },
    { key: 'revenueId', db: 'revenue_id' },
  ];

  for (const { key, db: dbField, isDate } of updatableFields) {
    if (paymentData[key] !== undefined) {
      fields.push(`${dbField} = $${paramIndex}`);
      
      if (isDate && paymentData[key]) {
        values.push(parseDate(paymentData[key]));
      } else {
        values.push(paymentData[key]);
      }
      paramIndex++;
    }
  }

  if (fields.length === 0) {
    throw new Error('No fields to update');
  }

  values.push(id);
  const query = `
    UPDATE project_payment_schedule
    SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
    WHERE id = $${paramIndex}
    RETURNING *
  `;

  const { rows } = await db.query(query, values);
  
  if (rows.length === 0) return null;
  return transformPayment(rows[0]);
}

/**
 * Удалить платёж
 */
async function deletePayment(id) {
  const result = await db.query('DELETE FROM project_payment_schedule WHERE id = $1 RETURNING id', [id]);
  return result.rowCount > 0;
}

/**
 * Отметить платёж как оплаченный
 */
async function markAsPaid(id, paidAmount, paymentDate, paymentReference) {
  const query = `
    UPDATE project_payment_schedule
    SET 
      paid_amount = COALESCE($2, amount),
      paid_date = COALESCE($3, CURRENT_DATE),
      payment_reference = $4,
      status = CASE 
        WHEN COALESCE($2, amount) >= amount THEN 'paid'
        WHEN COALESCE($2, amount) > 0 THEN 'partial'
        ELSE status
      END,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = $1
    RETURNING *
  `;

  const { rows } = await db.query(query, [id, paidAmount, paymentDate ? parseDate(paymentDate) : null, paymentReference || null]);
  
  if (rows.length === 0) return null;
  return transformPayment(rows[0]);
}

/**
 * Получить сводку по графику платежей
 */
async function getPaymentScheduleSummary(projectId) {
  const query = `
    SELECT
      COUNT(*) as total_payments,
      SUM(amount) as total_amount,
      SUM(paid_amount) as total_paid,
      SUM(amount) FILTER (WHERE status = 'pending') as pending_amount,
      SUM(amount) FILTER (WHERE status = 'overdue') as overdue_amount,
      COUNT(*) FILTER (WHERE status = 'overdue') as overdue_count,
      COUNT(*) FILTER (WHERE status = 'paid') as paid_count,
      MIN(due_date) FILTER (WHERE status IN ('pending', 'overdue')) as next_due_date
    FROM project_payment_schedule
    WHERE project_id = $1
  `;

  const { rows } = await db.query(query, [projectId]);
  
  if (rows.length === 0) {
    return {
      totalPayments: 0,
      totalAmount: 0,
      totalPaid: 0,
      pendingAmount: 0,
      overdueAmount: 0,
      overdueCount: 0,
      paidCount: 0,
      nextDueDate: null,
    };
  }

  const stats = rows[0];
  return {
    totalPayments: parseInt(stats.total_payments) || 0,
    totalAmount: parseFloat(stats.total_amount) || 0,
    totalPaid: parseFloat(stats.total_paid) || 0,
    pendingAmount: parseFloat(stats.pending_amount) || 0,
    overdueAmount: parseFloat(stats.overdue_amount) || 0,
    overdueCount: parseInt(stats.overdue_count) || 0,
    paidCount: parseInt(stats.paid_count) || 0,
    nextDueDate: stats.next_due_date ? formatDate(stats.next_due_date) : null,
  };
}

module.exports = {
  getPaymentSchedule,
  getPaymentById,
  createPayment,
  updatePayment,
  deletePayment,
  markAsPaid,
  getPaymentScheduleSummary,
};
