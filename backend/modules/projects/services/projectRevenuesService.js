/**
 * Сервис для управления доходами проекта
 * CRUD операции для project_revenues
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
 * Преобразование дохода
 */
function transformRevenue(revenue) {
  if (!revenue) return revenue;
  return {
    ...revenue,
    projectId: revenue.project_id,
    stageId: revenue.stage_id,
    contractorId: revenue.contractor_id,
    vatRate: parseFloat(revenue.vat_rate) || 0,
    vatAmount: parseFloat(revenue.vat_amount) || 0,
    plannedDate: revenue.planned_date ? formatDate(revenue.planned_date) : null,
    actualDate: revenue.actual_date ? formatDate(revenue.actual_date) : null,
    invoiceId: revenue.invoice_id,
    paymentId: revenue.payment_id,
    overdueSince: revenue.overdue_since ? formatDate(revenue.overdue_since) : null,
    isTaxable: revenue.is_taxable,
    incomeCategoryId: revenue.income_category_id,
    incomeCategoryName: revenue.category_name,
  };
}

/**
 * Получить все доходы проекта
 */
async function getRevenues(projectId) {
  const query = `
    SELECT pr.*, ic.name as category_name
    FROM project_revenues pr
    LEFT JOIN finance_income_categories ic ON pr.income_category_id = ic.id
    WHERE pr.project_id = $1
    ORDER BY pr.planned_date, pr.id
  `;
  
  const { rows } = await db.query(query, [projectId]);
  return rows.map(transformRevenue);
}

/**
 * Получить доход по ID
 */
async function getRevenueById(id) {
  const query = `
    SELECT pr.*, ic.name as category_name
    FROM project_revenues pr
    LEFT JOIN finance_income_categories ic ON pr.income_category_id = ic.id
    WHERE pr.id = $1
  `;
  const { rows } = await db.query(query, [id]);
  
  if (rows.length === 0) return null;
  return transformRevenue(rows[0]);
}

/**
 * Создать доход
 */
async function createRevenue(revenueData) {
  const {
    projectId,
    stageId,
    contractorId,
    name,
    description,
    amount,
    currency,
    vatRate,
    plannedDate,
    isTaxable,
    incomeCategoryId,
  } = revenueData;

  // Валидация
  if (!projectId || !name || amount === undefined || amount === null || !plannedDate) {
    throw new Error('Missing required fields: projectId, name, amount, plannedDate');
  }

  // Получение следующего ID
  const idRes = await db.query('SELECT COALESCE(MAX(id), 0) + 1 as "nextId" FROM project_revenues');
  const nextId = idRes.rows[0].nextId || idRes.rows[0].nextid;

  // Расчёт НДС если нужно
  const numAmount = Number(amount) || 0;
  const numVatRate = Number(vatRate) || 0;
  const vatAmount = isTaxable !== false && numVatRate ? (numAmount * numVatRate / 100) : 0;

  const query = `
    INSERT INTO project_revenues (
      id, project_id, stage_id, contractor_id, name, description,
      amount, currency, vat_rate, vat_amount, planned_date, is_taxable, income_category_id
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
    RETURNING *
  `;

  const values = [
    nextId,
    projectId,
    stageId || null,
    contractorId || null,
    name,
    description || null,
    numAmount,
    currency || 'RUB',
    numVatRate,
    vatAmount,
    parseDate(plannedDate),
    isTaxable !== false,
    incomeCategoryId || null,
  ];

  const { rows } = await db.query(query, values);
  return transformRevenue(rows[0]);
}

/**
 * Обновить доход
 */
async function updateRevenue(id, revenueData) {
  const fields = [];
  const values = [];
  let paramIndex = 1;

  const updatableFields = [
    { key: 'name', db: 'name' },
    { key: 'description', db: 'description' },
    { key: 'amount', db: 'amount', isNumber: true },
    { key: 'currency', db: 'currency' },
    { key: 'vatRate', db: 'vat_rate', isNumber: true },
    { key: 'plannedDate', db: 'planned_date', isDate: true },
    { key: 'actualDate', db: 'actual_date', isDate: true },
    { key: 'stageId', db: 'stage_id', isNumber: true },
    { key: 'contractorId', db: 'contractor_id', isNumber: true },
    { key: 'isTaxable', db: 'is_taxable' },
    { key: 'invoiceId', db: 'invoice_id', isNumber: true },
    { key: 'paymentId', db: 'payment_id', isNumber: true },
    { key: 'incomeCategoryId', db: 'income_category_id' },
  ];

  for (const { key, db: dbField, isDate, isNumber } of updatableFields) {
    if (revenueData[key] !== undefined) {
      fields.push(`${dbField} = $${paramIndex}`);
      
      if (isDate && revenueData[key]) {
        values.push(parseDate(revenueData[key]));
      } else if (isNumber) {
        values.push(revenueData[key] === null ? null : Number(revenueData[key]));
      } else {
        values.push(revenueData[key]);
      }
      paramIndex++;
    }
  }

  // Пересчёт НДС если изменилась сумма или ставка
  if (revenueData.amount !== undefined || revenueData.vatRate !== undefined || revenueData.isTaxable !== undefined) {
    const current = await getRevenueById(id);
    const amount = revenueData.amount !== undefined ? Number(revenueData.amount) : (current?.amount || 0);
    const vatRate = revenueData.vatRate !== undefined ? Number(revenueData.vatRate) : (current?.vatRate || 0);
    const isTaxable = revenueData.isTaxable !== undefined ? revenueData.isTaxable : (current?.isTaxable !== false);
    
    const vatAmount = isTaxable && vatRate ? (amount * vatRate / 100) : 0;
    fields.push(`vat_amount = $${paramIndex}`);
    values.push(vatAmount);
    paramIndex++;
  }

  if (fields.length === 0) {
    throw new Error('No fields to update');
  }

  values.push(id);
  const query = `
    UPDATE project_revenues
    SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
    WHERE id = $${paramIndex}
    RETURNING *
  `;

  const { rows } = await db.query(query, values);
  
  if (rows.length === 0) return null;
  return transformRevenue(rows[0]);
}

/**
 * Удалить доход
 */
async function deleteRevenue(id) {
  const result = await db.query('DELETE FROM project_revenues WHERE id = $1 RETURNING id', [id]);
  return result.rowCount > 0;
}

/**
 * Отметить доход как полученный
 */
async function markAsReceived(id, actualDate, amount) {
  const query = `
    UPDATE project_revenues
    SET 
      actual_date = COALESCE($2, CURRENT_DATE),
      status = 'received',
      overdue_since = NULL,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = $1
    RETURNING *
  `;

  const { rows } = await db.query(query, [id, actualDate ? parseDate(actualDate) : null]);
  
  if (rows.length === 0) return null;
  return transformRevenue(rows[0]);
}

/**
 * Получить сводку по доходам
 */
async function getRevenuesSummary(projectId) {
  const query = `
    SELECT
      COUNT(*) as total_revenues,
      SUM(amount) as total_amount,
      SUM(amount) FILTER (WHERE status = 'planned') as planned_amount,
      SUM(amount) FILTER (WHERE status = 'received') as received_amount,
      SUM(amount) FILTER (WHERE status = 'overdue') as overdue_amount,
      SUM(vat_amount) as total_vat,
      COUNT(*) FILTER (WHERE status = 'overdue') as overdue_count
    FROM project_revenues
    WHERE project_id = $1
  `;

  const { rows } = await db.query(query, [projectId]);
  
  if (rows.length === 0) {
    return {
      totalRevenues: 0,
      totalAmount: 0,
      plannedAmount: 0,
      receivedAmount: 0,
      overdueAmount: 0,
      totalVat: 0,
      overdueCount: 0,
    };
  }

  const stats = rows[0];
  return {
    totalRevenues: parseInt(stats.total_revenues) || 0,
    totalAmount: parseFloat(stats.total_amount) || 0,
    plannedAmount: parseFloat(stats.planned_amount) || 0,
    receivedAmount: parseFloat(stats.received_amount) || 0,
    overdueAmount: parseFloat(stats.overdue_amount) || 0,
    totalVat: parseFloat(stats.total_vat) || 0,
    overdueCount: parseInt(stats.overdue_count) || 0,
  };
}

module.exports = {
  getRevenues,
  getRevenueById,
  createRevenue,
  updateRevenue,
  deleteRevenue,
  markAsReceived,
  getRevenuesSummary,
};
