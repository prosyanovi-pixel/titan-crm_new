/**
 * Сервис для управления расходами проекта
 * CRUD операции для расходов проекта с интеграцией с finance_payments
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
 * Преобразование расхода проекта
 */
function transformProjectExpense(expense) {
  if (!expense) return expense;
  return {
    ...expense,
    projectId: expense.project_id,
    categoryId: expense.category_id,
    categoryName: expense.category_name,
    contractorId: expense.contractor_id,
    paymentId: expense.payment_id,
    plannedDate: expense.planned_date ? formatDate(expense.planned_date) : null,
    actualDate: expense.actual_date ? formatDate(expense.actual_date) : null,
    isApproved: expense.is_approved,
    isPaid: expense.is_paid,
  };
}

/**
 * Получить все расходы проекта
 */
async function getProjectExpenses(projectId) {
  const query = `
    SELECT 
      pe.*,
      fc.name as category_name
    FROM project_expenses pe
    LEFT JOIN finance_expense_categories fc ON pe.category_id = fc.id
    WHERE pe.project_id = $1
    ORDER BY pe.planned_date, pe.id
  `;
  
  const { rows } = await db.query(query, [projectId]);
  return rows.map(transformProjectExpense);
}

/**
 * Получить расход по ID
 */
async function getProjectExpenseById(id) {
  const query = `
    SELECT 
      pe.*,
      fc.name as category_name
    FROM project_expenses pe
    LEFT JOIN finance_expense_categories fc ON pe.category_id = fc.id
    WHERE pe.id = $1
  `;
  
  const { rows } = await db.query(query, [id]);
  if (rows.length === 0) return null;
  return transformProjectExpense(rows[0]);
}

/**
 * Создать расход проекта
 */
async function createProjectExpense(expenseData) {
  const {
    projectId,
    categoryId,
    category,
    contractorId,
    name,
    description,
    amount,
    plannedDate,
    isApproved,
    isPaid,
    stageId,
  } = expenseData;

  const finalCategoryId = categoryId || category;

  // Валидация
  if (!projectId || !name || amount === undefined || amount === null || !plannedDate) {
    throw new Error('Missing required fields: projectId, name, amount, plannedDate');
  }

  // Получение следующего ID
  const idRes = await db.query('SELECT COALESCE(MAX(id), 0) + 1 as "nextId" FROM project_expenses');
  const nextId = idRes.rows[0].nextId || idRes.rows[0].nextid;

  const numAmount = Number(amount) || 0;

  const query = `
    INSERT INTO project_expenses (
      id, project_id, category_id, contractor_id, name, description,
      amount, planned_date, is_approved, is_paid, stage_id
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    RETURNING *
  `;

  const values = [
    nextId,
    projectId,
    finalCategoryId || null,
    contractorId || null,
    name,
    description || null,
    numAmount,
    parseDate(plannedDate),
    isApproved || false,
    isPaid || false,
    stageId || null,
  ];

  const { rows } = await db.query(query, values);
  return transformProjectExpense(rows[0]);
}

/**
 * Обновить расход проекта
 */
async function updateProjectExpense(id, expenseData) {
  const fields = [];
  const values = [];
  let paramIndex = 1;

  const updatableFields = [
    { key: 'name', db: 'name' },
    { key: 'description', db: 'description' },
    { key: 'amount', db: 'amount', isNumber: true },
    { key: 'categoryId', db: 'category_id' },
    { key: 'category', db: 'category_id' },
    { key: 'stageId', db: 'stage_id', isNumber: true },
    { key: 'contractorId', db: 'contractor_id', isNumber: true },
    { key: 'plannedDate', db: 'planned_date', isDate: true },
    { key: 'actualDate', db: 'actual_date', isDate: true },
    { key: 'isApproved', db: 'is_approved' },
    { key: 'isPaid', db: 'is_paid' },
  ];

  for (const { key, db: dbField, isDate, isNumber } of updatableFields) {
    if (expenseData[key] !== undefined) {
      if (fields.some(f => f.startsWith(`${dbField} =`))) continue;

      fields.push(`${dbField} = $${paramIndex}`);
      
      if (isDate && expenseData[key]) {
        values.push(parseDate(expenseData[key]));
      } else if (isNumber) {
        values.push(expenseData[key] === null ? null : Number(expenseData[key]));
      } else {
        values.push(expenseData[key]);
      }
      paramIndex++;
    }
  }

  if (fields.length === 0) {
    throw new Error('No fields to update');
  }

  values.push(id);
  const query = `
    UPDATE project_expenses
    SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
    WHERE id = $${paramIndex}
    RETURNING *
  `;

  const { rows } = await db.query(query, values);
  
  if (rows.length === 0) return null;
  return transformProjectExpense(rows[0]);
}

/**
 * Удалить расход проекта
 */
async function deleteProjectExpense(id) {
  const result = await db.query('DELETE FROM project_expenses WHERE id = $1 RETURNING id', [id]);
  return result.rowCount > 0;
}

/**
 * Утвердить расход
 */
async function approveExpense(id) {
  const query = `
    UPDATE project_expenses
    SET is_approved = TRUE, updated_at = CURRENT_TIMESTAMP
    WHERE id = $1
    RETURNING *
  `;

  const { rows } = await db.query(query, [id]);
  if (rows.length === 0) return null;
  return transformProjectExpense(rows[0]);
}

/**
 * Отметить расход как оплаченный
 */
async function markExpensePaid(id, paymentId, actualDate) {
  const query = `
    UPDATE project_expenses
    SET 
      is_paid = TRUE,
      actual_date = COALESCE($2, CURRENT_DATE),
      payment_id = $3,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = $1
    RETURNING *
  `;

  const { rows } = await db.query(query, [id, actualDate ? parseDate(actualDate) : null, paymentId || null]);
  if (rows.length === 0) return null;
  return transformProjectExpense(rows[0]);
}

/**
 * Получить сводку по расходам проекта
 */
async function getProjectExpensesSummary(projectId) {
  const query = `
    SELECT
      COUNT(*) as total_expenses,
      SUM(amount) as total_amount,
      SUM(amount) FILTER (WHERE is_approved) as approved_amount,
      SUM(amount) FILTER (WHERE is_paid) as paid_amount,
      SUM(amount) FILTER (WHERE NOT is_paid AND is_approved) as pending_amount,
      COUNT(*) FILTER (WHERE is_approved) as approved_count,
      COUNT(*) FILTER (WHERE is_paid) as paid_count
    FROM project_expenses
    WHERE project_id = $1
  `;

  const { rows } = await db.query(query, [projectId]);
  
  if (rows.length === 0) {
    return {
      totalExpenses: 0,
      totalAmount: 0,
      approvedAmount: 0,
      paidAmount: 0,
      pendingAmount: 0,
      approvedCount: 0,
      paidCount: 0,
    };
  }

  const stats = rows[0];
  return {
    totalExpenses: parseInt(stats.total_expenses) || 0,
    totalAmount: parseFloat(stats.total_amount) || 0,
    approvedAmount: parseFloat(stats.approved_amount) || 0,
    paidAmount: parseFloat(stats.paid_amount) || 0,
    pendingAmount: parseFloat(stats.pending_amount) || 0,
    approvedCount: parseInt(stats.approved_count) || 0,
    paidCount: parseInt(stats.paid_count) || 0,
  };
}

/**
 * Получить категории расходов из Finance
 */
async function getExpenseCategories() {
  const query = `
    SELECT 
      id,
      name,
      kind,
      parent_id as "parentId",
      color,
      is_system as "isSystem",
      is_overhead as "isOverhead",
      is_direct as "isDirect"
    FROM finance_expense_categories
    WHERE kind = 'expense'
    ORDER BY parent_id, name
  `;

  const { rows } = await db.query(query);
  return rows;
}

/**
 * Получить данные для графика расходов проекта
 */
async function getProjectExpensesChartData(projectId) {
  const query = `
    SELECT 
      TO_CHAR(planned_date, 'DD.MM') as name,
      SUM(amount) as value
    FROM project_expenses
    WHERE project_id = $1 AND planned_date IS NOT NULL
    GROUP BY TO_CHAR(planned_date, 'DD.MM'), planned_date
    ORDER BY planned_date DESC
    LIMIT 7
  `;
  
  const { rows } = await db.query(query, [projectId]);
  return rows.reverse().map(row => ({
    name: row.name,
    value: Number(row.value)
  }));
}

module.exports = {
  getProjectExpenses,
  getProjectExpenseById,
  createProjectExpense,
  updateProjectExpense,
  deleteProjectExpense,
  approveExpense,
  markExpensePaid,
  getProjectExpensesSummary,
  getProjectExpensesChartData,
  getExpenseCategories,
};
