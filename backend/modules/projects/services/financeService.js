/**
 * Сервис для работы с финансами проектов
 * Инкапсулирует логику расчета финансовых показателей
 */

const db = require('../../../db');

/**
 * @typedef {Object} FinanceInfo
 * @property {boolean} hasOverdueInvoice - Есть ли просроченные счета
 * @property {string|null} financeStatus - Статус финансирования
 * @property {number} totalPaid - Всего оплачено
 * @property {number} totalExpenses - Всего расходов
 * @property {number} budgetUsedPercent - Процент использования бюджета
 */

/**
 * Загрузить финансовую информацию для проекта
 * @param {number} projectId - ID проекта
 * @returns {Promise<FinanceInfo>} Финансовая информация
 */
async function loadFinanceInfo(projectId) {
  try {
    const financeResult = await db.query(
      `SELECT
         BOOL_OR(status = 'overdue') AS has_overdue_invoice,
         CASE
           WHEN BOOL_OR(status = 'overdue') THEN 'overdue'
           WHEN BOOL_OR(status = 'partial_paid') THEN 'partial_paid'
           WHEN BOOL_OR(status = 'sent') THEN 'sent'
           WHEN BOOL_OR(status = 'draft') THEN 'draft'
           WHEN BOOL_OR(status = 'paid') THEN 'paid'
           ELSE NULL
         END AS finance_status
       FROM finance_invoices
       WHERE project_id = $1`,
      [projectId]
    );

    return {
      hasOverdueInvoice: Boolean(financeResult.rows[0]?.hasOverdueInvoice),
      financeStatus: financeResult.rows[0]?.financeStatus || null,
    };
  } catch (error) {
    console.error(`Error loading finance info for project ${projectId}:`, error);
    return { hasOverdueInvoice: false, financeStatus: null };
  }
}

/**
 * Рассчитать финансовые показатели проекта
 * @param {number} projectId - ID проекта
 * @param {number} budget - Бюджет проекта
 * @returns {Promise<{totalPaid: number, totalExpenses: number, budgetUsedPercent: number}>}
 */
async function calculateProjectFinance(projectId, budget) {
  try {
    // 1. Доходы из счетов (finance_invoices) + прямые доходы (finance_payments)
    const invoiceResult = await db.query(
      `SELECT COALESCE(SUM(amount_paid), 0) AS total_paid FROM finance_invoices WHERE project_id = $1`,
      [projectId]
    );

    const directIncomeResult = await db.query(
      `SELECT COALESCE(SUM(amount), 0) AS direct_income FROM finance_payments WHERE project_id = $1 AND kind = 'income' AND invoice_id IS NULL`,
      [projectId]
    );

    // 2. Доходы из проектных доходов (project_revenues) - только полученные, если они не привязаны к счету/платежу
    // (чтобы избежать дублирования, считаем только те, у которых нет invoice_id и payment_id)
    const projectRevenuesResult = await db.query(
      `SELECT COALESCE(SUM(amount), 0) AS project_income FROM project_revenues 
       WHERE project_id = $1 AND status = 'received' AND invoice_id IS NULL AND payment_id IS NULL`,
      [projectId]
    );

    // 3. Расходы из платежей (finance_payments)
    const expenseResult = await db.query(
      `SELECT COALESCE(SUM(amount), 0) AS total_expenses FROM finance_payments 
       WHERE project_id = $1 AND kind = 'expense'`,
      [projectId]
    );

    // 4. Расходы из проектных расходов (project_expenses)
    // Считаем только те, которые не привязаны к платежу, чтобы избежать дублирования
    const projectExpensesResult = await db.query(
      `SELECT COALESCE(SUM(amount), 0) AS project_expenses FROM project_expenses 
       WHERE project_id = $1 AND (is_paid = TRUE OR is_approved = TRUE) AND payment_id IS NULL`,
      [projectId]
    );

    const totalPaid = (Number(invoiceResult.rows[0].totalPaid) || 0) + 
                      (Number(directIncomeResult.rows[0].directIncome) || 0) +
                      (Number(projectRevenuesResult.rows[0].projectIncome) || 0);

    const totalExpenses = (Number(expenseResult.rows[0].totalExpenses) || 0) +
                          (Number(projectExpensesResult.rows[0].projectExpenses) || 0);

    const budgetNum = Number(budget) || 0;
    const budgetUsedPercent = budgetNum > 0 ? Math.round((totalExpenses / budgetNum) * 100) : 0;

    return { totalPaid, totalExpenses, budgetUsedPercent };
  } catch (error) {
    console.error(`Error calculating project finance for project ${projectId}:`, error);
    return { totalPaid: 0, totalExpenses: 0, budgetUsedPercent: 0 };
  }
}

/**
 * Получить полные финансовые данные для проекта
 * @param {number} projectId - ID проекта
 * @param {number} budget - Бюджет проекта
 * @returns {Promise<FinanceInfo>} Полная финансовая информация
 */
async function getProjectFinanceData(projectId, budget) {
  const [financeInfo, calculatedFinance] = await Promise.all([
    loadFinanceInfo(projectId),
    calculateProjectFinance(projectId, budget)
  ]);

  return {
    ...financeInfo,
    ...calculatedFinance,
  };
}

/**
 * Загрузить финансовые данные для нескольких проектов
 * @param {Array<Object>} projects - Массив проектов
 * @returns {Promise<Map<number, FinanceInfo>>} Map с финансовыми данными по ID проекта
 */
async function loadFinanceForProjects(projects) {
  let financeByProjectId = new Map();

  try {
    // Получаем сводные данные по всем проектам
    const { rows: financeRows } = await db.query(
      `SELECT
         project_id,
         BOOL_OR(status = 'overdue') AS has_overdue_invoice,
         CASE
           WHEN BOOL_OR(status = 'overdue') THEN 'overdue'
           WHEN BOOL_OR(status = 'partial_paid') THEN 'partial_paid'
           WHEN BOOL_OR(status = 'sent') THEN 'sent'
           WHEN BOOL_OR(status = 'draft') THEN 'draft'
           WHEN BOOL_OR(status = 'paid') THEN 'paid'
           ELSE NULL
         END AS finance_status
       FROM finance_invoices
       WHERE project_id IS NOT NULL
       GROUP BY project_id`
    );

    financeByProjectId = new Map(
      financeRows.map((row) => [
        Number(row.project_id),
        {
          hasOverdueInvoice: Boolean(row.has_overdue_invoice),
          financeStatus: row.finance_status || null,
        },
      ])
    );
  } catch (financeError) {
    console.error('Error loading finance for projects:', financeError);
    financeByProjectId.clear();
  }

  // Рассчитываем финансовые показатели для каждого проекта
  for (const project of projects) {
    const projectId = Number(project.id);
    const budget = Number(project.budget) || 0;
    
    try {
      const calculated = await calculateProjectFinance(projectId, budget);
      const existing = financeByProjectId.get(projectId) || {
        hasOverdueInvoice: false,
        financeStatus: null,
      };
      
      financeByProjectId.set(projectId, {
        ...existing,
        ...calculated,
      });
    } catch (error) {
      financeByProjectId.set(projectId, {
        hasOverdueInvoice: false,
        financeStatus: null,
        totalPaid: 0,
        totalExpenses: 0,
        budgetUsedPercent: 0,
      });
    }
  }

  return financeByProjectId;
}

module.exports = {
  loadFinanceInfo,
  calculateProjectFinance,
  getProjectFinanceData,
  loadFinanceForProjects,
};
