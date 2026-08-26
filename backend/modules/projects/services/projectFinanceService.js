/**
 * Сервис для расчёта финансовой аналитики проекта
 * P&L отчёт, рентабельность, освоение бюджета
 */

const db = require('../../../db');
const { formatDate } = require('../../../utils/dateHelpers');

/**
 * Получить финансовые данные проекта для P&L расчёта
 */
async function getProjectFinanceData(projectId) {
  // Получаем информацию о проекте
  const projectRes = await db.query(
    'SELECT * FROM projects WHERE id = $1',
    [projectId]
  );
  
  if (projectRes.rows.length === 0) {
    return null;
  }
  
  const project = projectRes.rows[0];
  
  // Получаем доходы
  const revenuesRes = await db.query(
    `SELECT 
       SUM(amount) as total_revenue,
       SUM(vat_amount) as total_vat,
       SUM(amount) FILTER (WHERE status = 'received') as received_revenue,
       SUM(amount) FILTER (WHERE status = 'planned') as planned_revenue
     FROM project_revenues
     WHERE project_id = $1`,
    [projectId]
  );
  
  const revenues = revenuesRes.rows[0];
  
  // Получаем расходы по категориям
  const expensesRes = await db.query(
    `SELECT 
       fc.name as category_name,
       fc.kind as category_kind,
       SUM(pe.amount) as amount
     FROM project_expenses pe
     LEFT JOIN finance_expense_categories fc ON pe.category_id = fc.id
     WHERE pe.project_id = $1
     GROUP BY fc.name, fc.kind
     ORDER BY fc.name`,
    [projectId]
  );
  
  // Получаем сводку по платежам (график платежей)
  const paymentsRes = await db.query(
    `SELECT
       SUM(amount) as total_amount,
       SUM(paid_amount) as total_paid
     FROM project_payment_schedule
     WHERE project_id = $1`,
    [projectId]
  );
  
  const payments = paymentsRes.rows[0];
  
  // Получаем режим налогообложения проекта
  let taxRegime = null;
  if (project.tax_regime_id) {
    const taxRes = await db.query(
      'SELECT * FROM finance_tax_regimes WHERE id = $1',
      [project.tax_regime_id]
    );
    if (taxRes.rows.length > 0) {
      taxRegime = taxRes.rows[0];
    }
  }
  
  return {
    project,
    revenues: {
      total: parseFloat(revenues.total_revenue) || 0,
      vat: parseFloat(revenues.total_vat) || 0,
      received: parseFloat(revenues.received_revenue) || 0,
      planned: parseFloat(revenues.planned_revenue) || 0,
    },
    expenses: expensesRes.rows.map(row => ({
      category: row.category_name || 'Без категории',
      kind: row.category_kind || 'expense',
      amount: parseFloat(row.amount) || 0,
    })),
    payments: {
      total: parseFloat(payments.total_amount) || 0,
      paid: parseFloat(payments.total_paid) || 0,
    },
    taxRegime,
  };
}

/**
 * Рассчитать налоги для проекта
 * Использует ставки из finance_tax_rates (БД)
 */
async function calculateTaxes(financeData) {
  const { revenues, taxRegime, projectId } = financeData;

  if (!taxRegime) {
    return {
      vat: 0,
      usn: 0,
      profitTax: 0,
      insurance: 0,
      ndfl: 0,
      total: 0,
    };
  }

  const taxes = {
    vat: 0,
    usn: 0,
    profitTax: 0,
    insurance: 0,
    ndfl: 0,
    total: 0,
  };

  // Получаем детальные ставки из БД
  const taxRatesRes = await db.query(
    'SELECT tax_type, rate, is_fixed, fixed_amount FROM finance_tax_rates WHERE tax_regime_id = $1 AND is_active = TRUE',
    [taxRegime.id]
  );

  const taxRates = {};
  for (const row of taxRatesRes.rows) {
    taxRates[row.tax_type] = {
      rate: parseFloat(row.rate) || 0,
      isFixed: row.is_fixed,
      fixedAmount: parseFloat(row.fixed_amount) || 0,
    };
  }

  // НДС
  if (taxRegime.has_vat && taxRates.vat) {
    const vatRate = taxRates.vat;
    taxes.vat = vatRate.isFixed 
      ? vatRate.fixedAmount 
      : revenues.total * (vatRate.rate / 100);
  }

  // Выручка без НДС
  const revenueExcludingVat = revenues.total - taxes.vat;

  // УСН
  if (taxRegime.has_usn_tax && taxRates.usn) {
    const usnRate = taxRates.usn;
    taxes.usn = usnRate.isFixed
      ? usnRate.fixedAmount
      : revenueExcludingVat * (usnRate.rate / 100);
  }

  // Налог на прибыль
  if (taxRegime.has_profit_tax && taxRates.profit_tax) {
    const profitTaxRate = taxRates.profit_tax;
    taxes.profitTax = profitTaxRate.isFixed
      ? profitTaxRate.fixedAmount
      : revenueExcludingVat * (profitTaxRate.rate / 100);
  }

  // Страховые взносы
  if (taxRegime.has_insurance && taxRates.insurance) {
    const insuranceRate = taxRates.insurance;
    const estimatedSalary = financeData.expenses
      .filter(e => e.kind === 'salary' || e.category.includes('ФОТ') || e.category.includes('Зарплата'))
      .reduce((sum, e) => sum + e.amount, 0);

    // Если нет явного ФОТ, оцениваем как 30% от всех расходов
    const salaryBase = estimatedSalary > 0 
      ? estimatedSalary
      : financeData.expenses.reduce((sum, e) => sum + e.amount, 0) * 0.3;

    taxes.insurance = insuranceRate.isFixed
      ? insuranceRate.fixedAmount
      : salaryBase * (insuranceRate.rate / 100);
  }

  // НДФЛ (13% от ФОТ)
  if (taxRegime.has_ndfl && taxRates.ndfl) {
    const ndflRate = taxRates.ndfl;
    const estimatedSalary = financeData.expenses
      .filter(e => e.kind === 'salary' || e.category.includes('ФОТ') || e.category.includes('Зарплата'))
      .reduce((sum, e) => sum + e.amount, 0);

    taxes.ndfl = ndflRate.isFixed
      ? ndflRate.fixedAmount
      : estimatedSalary * (ndflRate.rate / 100);
  }

  taxes.total = taxes.vat + taxes.usn + taxes.profitTax + taxes.insurance + taxes.ndfl;

  return taxes;
}

/**
 * Сформировать P&L отчёт
 */
async function generatePnLReport(financeData) {
  const { revenues, expenses, project } = financeData;
  
  // Выручка
  const revenueTotal = revenues.total;
  const vatAmount = revenues.vat;
  const revenueExcludingVat = revenueTotal - vatAmount;
  
  // Прямые расходы
  const directExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  
  // Детализация расходов (группировка по типам)
  const expensesBreakdown = {
    salary: expenses
      .filter(e => e.kind === 'salary' || e.category.includes('ФОТ') || e.category.includes('Зарплата'))
      .reduce((sum, e) => sum + e.amount, 0),
    materials: expenses
      .filter(e => e.category.includes('Материал') || e.category.includes('Товар'))
      .reduce((sum, e) => sum + e.amount, 0),
    services: expenses
      .filter(e => e.category.includes('Услуг') || e.category.includes('Аренда'))
      .reduce((sum, e) => sum + e.amount, 0),
    other: expenses
      .filter(e => 
        !e.category.includes('ФОТ') && 
        !e.category.includes('Зарплата') &&
        !e.category.includes('Материал') && 
        !e.category.includes('Товар') &&
        !e.category.includes('Услуг') &&
        !e.category.includes('Аренда')
      )
      .reduce((sum, e) => sum + e.amount, 0),
  };
  
  // Валовая прибыль
  const grossProfit = revenueExcludingVat - directExpenses;
  const grossMargin = revenueExcludingVat > 0 ? (grossProfit / revenueExcludingVat) * 100 : 0;
  
  // Накладные расходы (пока 0, будет позже)
  const overheadExpenses = project.overhead_allocated || 0;
  
  // Операционная прибыль
  const operatingProfit = grossProfit - overheadExpenses;
  const operatingMargin = revenueExcludingVat > 0 ? (operatingProfit / revenueExcludingVat) * 100 : 0;
  
  // Налоги (теперь async)
  const taxes = await calculateTaxes(financeData);
  
  // Чистая прибыль
  const netProfit = operatingProfit - taxes.total;
  const netMargin = revenueExcludingVat > 0 ? (netProfit / revenueExcludingVat) * 100 : 0;
  
  // Рентабельность
  const profitability = directExpenses > 0 ? (netProfit / directExpenses) * 100 : 0;
  
  // Освоение бюджета
  const budget = parseFloat(project.budget) || 0;
  const budgetUsed = directExpenses + overheadExpenses;
  const budgetUsagePercent = budget > 0 ? (budgetUsed / budget) * 100 : 0;
  
  return {
    projectId: project.id,
    projectName: project.name,
    
    // Выручка
    revenue: revenueTotal,
    vatAmount: vatAmount,
    revenueExcludingVat: revenueExcludingVat,
    
    // Прямые расходы
    directExpenses: directExpenses,
    directExpensesBreakdown: expensesBreakdown,
    
    // Валовая прибыль
    grossProfit: grossProfit,
    grossMargin: parseFloat(grossMargin.toFixed(2)),
    
    // Накладные расходы
    overheadExpenses: overheadExpenses,
    
    // Операционная прибыль
    operatingProfit: operatingProfit,
    operatingMargin: parseFloat(operatingMargin.toFixed(2)),
    
    // Налоги
    taxes: taxes,
    
    // Чистая прибыль
    netProfit: netProfit,
    netMargin: parseFloat(netMargin.toFixed(2)),
    
    // Рентабельность
    profitability: parseFloat(profitability.toFixed(2)),
    
    // Бюджет
    budget: budget,
    budgetUsed: budgetUsed,
    budgetUsagePercent: parseFloat(budgetUsagePercent.toFixed(2)),
    
    calculatedAt: new Date().toISOString(),
  };
}

/**
 * Получить P&L отчёт по проекту
 */
async function getPnLReport(projectId) {
  const financeData = await getProjectFinanceData(projectId);
  
  if (!financeData) {
    return null;
  }
  
  return await generatePnLReport(financeData);
}

/**
 * Получить краткую финансовую аналитику для списка проектов
 */
async function getProjectFinanceSummary(projectId) {
  const financeData = await getProjectFinanceData(projectId);
  
  if (!financeData) {
    return null;
  }
  
  const pnl = await generatePnLReport(financeData);
  
  return {
    projectId: pnl.projectId,
    projectName: pnl.projectName,
    
    // Бюджет
    budgetTotal: pnl.budget,
    budgetUsed: pnl.budgetUsed,
    budgetUsagePercent: pnl.budgetUsagePercent,
    
    // Доходы
    revenuePlanned: financeData.revenues.planned,
    revenueActual: financeData.revenues.received,
    
    // Расходы
    expensesTotal: pnl.directExpenses,
    
    // Прибыль
    profitPlanned: Math.max(0, (financeData.revenues.planned || 0) - (pnl.budget || 0)), // Рассчитано на основе плановой выручки и бюджета
    profitActual: pnl.netProfit,
    
    // Рентабельность
    profitabilityActual: pnl.profitability,
    
    // Налоги
    taxesAccrued: pnl.taxes.total,
    
    calculatedAt: pnl.calculatedAt,
  };
}

module.exports = {
  getProjectFinanceData,
  calculateTaxes,
  generatePnLReport,
  getPnLReport,
  getProjectFinanceSummary,
};
