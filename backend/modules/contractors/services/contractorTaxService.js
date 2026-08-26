/**
 * Сервис для управления налоговой информацией контрагентов
 * Обеспечивает установку налогового режима, получение налоговой информации, проверку лимитов
 */

const db = require('../../../db');
const financeSettingsService = require('../../finance/services/financeSettingsService');
const legalFormService = require('./legalFormService');

/**
 * Преобразование налоговой информации контрагента
 */
async function transformContractorTaxInfo(contractorId) {
  // Получаем базовые данные контрагента
  const contractorRes = await db.query(`
    SELECT c.id, c.name, c.legal_form, c.tax_regime_id, 
           NULL as annual_income, NULL as employee_count, false as has_online_cashier,
           r.code as regime_code, r.name as regime_name
    FROM contractors c
    LEFT JOIN finance_tax_regimes r ON c.tax_regime_id = r.id
    WHERE c.id = $1
  `, [contractorId]);
  
  if (contractorRes.rows.length === 0) {
    throw new Error(`Контрагент с ID ${contractorId} не найден`);
  }
  
  const contractor = contractorRes.rows[0];
  const legalForm = contractor.legalForm;
  const taxRegimeId = contractor.taxRegimeId;
  
  // Получаем объект налогового режима
  let taxRegime = null;
  if (taxRegimeId) {
    taxRegime = await financeSettingsService.getTaxRegimeById(taxRegimeId);
  }
  
  // Получаем активные налоги на текущую дату
  const activeTaxes = taxRegimeId 
    ? await financeSettingsService.getActiveTaxes(contractorId, new Date())
    : [];
  
  // Проверяем соответствие лимитам
  const limitsCheck = await checkLimits(contractorId);
  
  // Получаем историю изменений
  const history = await getTaxHistory(contractorId);
  
  return {
    contractorId: contractor.id,
    contractorName: contractor.name,
    legalForm,
    taxRegime,
    activeTaxes: activeTaxes.map(tax => ({
      type: tax.taxType,
      name: tax.name,
      rate: tax.rate,
      amount: null, // требуется расчёт на основе данных контрагента
      period: 'current',
      dueDate: null,
    })),
    limitsCheck,
    history,
    lastUpdated: new Date().toISOString(),
  };
}

/**
 * Установить налоговый режим для контрагента
 * @param {number} contractorId - ID контрагента
 * @param {number} regimeId - ID налогового режима
 * @param {Object} options - Дополнительные параметры
 * @param {string} options.reason - Причина изменения
 * @param {string} options.effectiveFrom - Дата вступления в силу
 * @returns {Promise<Object>} Результат операции
 */
async function setTaxRegime(contractorId, regimeId, options = {}) {
  const { reason = '', effectiveFrom = new Date().toISOString().split('T')[0] } = options;
  
  // Проверяем существование контрагента
  const contractorRes = await db.query('SELECT id, legal_form FROM contractors WHERE id = $1', [contractorId]);
  if (contractorRes.rows.length === 0) {
    throw new Error(`Контрагент с ID ${contractorId} не найден`);
  }
  
  // Проверяем существование режима
  const regime = await financeSettingsService.getTaxRegimeById(regimeId);
  if (!regime) {
    throw new Error(`Налоговый режим с ID ${regimeId} не найден`);
  }
  
  // Валидация режима для контрагента
  const validation = await financeSettingsService.validateRegimeForContractor(contractorId, regimeId);
  if (!validation.valid) {
    throw new Error(validation.error);
  }
  
  // Получаем текущий режим для истории
  const currentRegimeRes = await db.query(
    'SELECT tax_regime_id FROM contractors WHERE id = $1',
    [contractorId]
  );
  const oldRegimeId = currentRegimeRes.rows[0]?.taxRegimeId;
  
  // Обновляем режим контрагента
  await db.query(
    'UPDATE contractors SET tax_regime_id = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
    [regimeId, contractorId]
  );
  
  // Записываем в историю
  await db.query(
    `INSERT INTO contractor_tax_history 
     (contractor_id, previous_tax_regime_id, tax_regime_id, change_reason, effective_date, changed_by_user_id, change_type)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [
      contractorId,
      oldRegimeId,
      regimeId,
      reason,
      effectiveFrom,
      options.changedBy || null,
      'manual'
    ]
  );
  
  return {
    success: true,
    contractorId,
    oldRegimeId,
    newRegimeId: regimeId,
    effectiveFrom,
    validation,
  };
}

/**
 * Получить налоговую информацию контрагента
 * @param {number} contractorId - ID контрагента
 * @returns {Promise<Object>} Налоговая информация
 */
async function getTaxInfo(contractorId) {
  return transformContractorTaxInfo(contractorId);
}

/**
 * Получить историю изменений системы налогообложения
 * @param {number} contractorId - ID контрагента
 * @returns {Promise<Array>} История изменений
 */
async function getTaxHistory(contractorId) {
  const { rows } = await db.query(`
    SELECT h.id, h.previous_tax_regime_id, h.tax_regime_id, h.change_reason as reason, 
           h.effective_date as effective_from, h.changed_by_user_id as changed_by, h.created_at,
           old_r.code as old_regime_code, old_r.name as old_regime_name,
           new_r.code as new_regime_code, new_r.name as new_regime_name
    FROM contractor_tax_history h
    LEFT JOIN finance_tax_regimes old_r ON h.previous_tax_regime_id = old_r.id
    LEFT JOIN finance_tax_regimes new_r ON h.tax_regime_id = new_r.id
    WHERE h.contractor_id = $1
    ORDER BY h.created_at DESC
  `, [contractorId]);
  
  return rows.map(row => ({
    id: row.id,
    date: row.createdAt,
    oldRegime: row.previousTaxRegimeId ? {
      id: row.previousTaxRegimeId,
      code: row.oldRegimeCode,
      name: row.oldRegimeName,
    } : null,
    newRegime: row.taxRegimeId ? {
      id: row.taxRegimeId,
      code: row.newRegimeCode,
      name: row.newRegimeName,
    } : null,
    reason: row.reason,
    effectiveFrom: row.effectiveFrom,
    changedBy: row.changedBy,
  }));
}

/**
 * Проверить соответствие лимитам текущего режима
 * @param {number} contractorId - ID контрагента
 * @returns {Promise<Object>} Результат проверки
 */
async function checkLimits(contractorId) {
  const contractorRes = await db.query(`
    SELECT c.tax_regime_id, NULL as annual_income, NULL as employee_count, false as has_online_cashier,
           r.max_income_limit, r.max_employees_limit, r.requires_online_cashier
    FROM contractors c
    LEFT JOIN finance_tax_regimes r ON c.tax_regime_id = r.id
    WHERE c.id = $1
  `, [contractorId]);
  
  if (contractorRes.rows.length === 0) {
    throw new Error(`Контрагент с ID ${contractorId} не найден`);
  }
  
  const data = contractorRes.rows[0];
  const result = {
    passed: true,
    warnings: [],
    details: {
      income: { actual: data.annualIncome, limit: data.maxIncomeLimit, passed: true },
      employees: { actual: data.employeeCount, limit: data.maxEmployeesLimit, passed: true },
      onlineCashier: { required: data.requiresOnlineCashier, has: data.hasOnlineCashier, passed: true },
    },
  };
  
  // Проверка лимита дохода
  if (data.maxIncomeLimit && data.annualIncome) {
    if (data.annualIncome > data.maxIncomeLimit) {
      result.passed = false;
      result.details.income.passed = false;
      result.warnings.push(`Превышен лимит дохода: ${data.annualIncome} > ${data.maxIncomeLimit}`);
    }
  }
  
  // Проверка лимита сотрудников
  if (data.maxEmployeesLimit && data.employeeCount) {
    if (data.employeeCount > data.maxEmployeesLimit) {
      result.passed = false;
      result.details.employees.passed = false;
      result.warnings.push(`Превышен лимит сотрудников: ${data.employeeCount} > ${data.maxEmployeesLimit}`);
    }
  }
  
  // Проверка онлайн-кассы
  if (data.requiresOnlineCashier && !data.hasOnlineCashier) {
    result.details.onlineCashier.passed = false;
    result.warnings.push('Требуется онлайн-касса, но у контрагента она не указана');
  }
  
  return result;
}

/**
 * Получить рекомендации по оптимизации налогов
 * @param {number} contractorId - ID контрагента
 * @returns {Promise<Array>} Список рекомендаций
 */
async function getTaxOptimizationSuggestions(contractorId) {
  const contractorRes = await db.query(`
    SELECT c.legal_form, NULL as annual_income, NULL as employee_count, c.tax_regime_id,
           r.code as current_regime_code
    FROM contractors c
    LEFT JOIN finance_tax_regimes r ON c.tax_regime_id = r.id
    WHERE c.id = $1
  `, [contractorId]);
  
  if (contractorRes.rows.length === 0) {
    return [];
  }
  
  const contractor = contractorRes.rows[0];
  const suggestions = [];
  
  // Если нет налогового режима
  if (!contractor.taxRegimeId) {
    suggestions.push({
      type: 'warning',
      title: 'Не указан налоговый режим',
      description: 'У контрагента не выбран налоговый режим. Это может привести к ошибкам расчёта налогов.',
      action: 'Установить налоговый режим',
      priority: 'high',
    });
  }
  
  // Если годовой доход > 10 млн и текущий режим ОСН, предложить УСН
  if (contractor.annualIncome > 10000000 && contractor.currentRegimeCode === 'OSN') {
    suggestions.push({
      type: 'optimization',
      title: 'Возможен переход на УСН',
      description: `При годовом доходе ${contractor.annualIncome.toLocaleString('ru-RU')} ₽ возможна оптимизация налогов путём перехода на УСН (6% от доходов или 15% от доходов минус расходы).`,
      action: 'Рассчитать альтернативные режимы',
      priority: 'medium',
    });
  }
  
  // Если сотрудников больше 100 и режим УСН, проверить лимит
  if (contractor.employeeCount > 100 && contractor.currentRegimeCode === 'USN_INCOME') {
    suggestions.push({
      type: 'limit',
      title: 'Проверка лимита сотрудников для УСН',
      description: 'Для УСН действует лимит в 100 сотрудников. Рассмотрите переход на ОСН.',
      action: 'Проверить лимиты',
      priority: 'medium',
    });
  }
  
  // Если есть онлайн-касса, но не используется
  suggestions.push({
    type: 'info',
    title: 'Проверка онлайн-кассы',
    description: 'Убедитесь, что контрагент использует онлайн-кассу, если это требуется по его налоговому режиму.',
    action: 'Обновить информацию об онлайн-кассе',
    priority: 'low',
  });
  
  return suggestions;
}

module.exports = {
  setTaxRegime,
  getTaxInfo,
  getTaxHistory,
  checkLimits,
  getTaxOptimizationSuggestions,
  transformContractorTaxInfo,
};