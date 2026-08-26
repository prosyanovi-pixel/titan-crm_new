/**
 * Сервис для управления настройками Finance
 * Режимы налогообложения, ставки налогов, методы распределения, накладные расходы
 */

const db = require('../../../db');
const {
  parseDate,
  transformTaxRegime,
  transformTaxRate,
  transformAllocationMethod,
  transformOverheadArticle,
  transformDefaultsSettings,
} = require('./financeSettingsTransforms');
const {
  getDefaultsSettings,
  updateDefaultsSettings,
} = require('./financeSettingsDefaults');

// ============================================================
// РЕЖИМЫ НАЛОГООБЛОЖЕНИЯ (TAX REGIMES)
// ============================================================

/**
 * Получить все режимы налогообложения
 */
async function getTaxRegimes() {
  const { rows } = await db.query('SELECT * FROM finance_tax_regimes ORDER BY code');
  return rows.map(transformTaxRegime);
}

/**
 * Получить режим налогообложения по ID
 */
async function getTaxRegimeById(id) {
  const { rows } = await db.query('SELECT * FROM finance_tax_regimes WHERE id = $1', [id]);
  if (rows.length === 0) return null;
  return transformTaxRegime(rows[0]);
}

/**
 * Создать режим налогообложения
 */
async function createTaxRegime(data) {
  const idRes = await db.query('SELECT COALESCE(MAX(id), 0) + 1 as "nextId" FROM finance_tax_regimes');
  const nextId = idRes.rows[0].nextId;

  const query = `
    INSERT INTO finance_tax_regimes (
      id, code, name, description, is_active,
      has_vat, has_profit_tax, has_usn_tax, has_insurance, has_ndfl,
      default_vat_rate, default_profit_tax_rate, default_usn_rate, default_insurance_rate, default_ndfl_rate,
      applies_to_legal_forms, valid_from, valid_to, requires_nds,
      max_income_limit, max_employees_limit, requires_online_cashier
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22)
    RETURNING *
  `;

  const values = [
    nextId,
    data.code,
    data.name,
    data.description || null,
    data.isActive !== false,
    data.hasVat || false,
    data.hasProfitTax || false,
    data.hasUsnTax || false,
    data.hasInsurance || false,
    data.hasNdfl || false,
    data.defaultVatRate || 20.00,
    data.defaultProfitTaxRate || 20.00,
    data.defaultUsnRate || 6.00,
    data.defaultInsuranceRate || 30.00,
    data.defaultNdflRate || 13.00,
    Array.isArray(data.appliesToLegalForms) ? data.appliesToLegalForms : (data.applies_to_legal_forms || []),
    data.validFrom || data.valid_from || '2024-01-01',
    data.validTo || data.valid_to || '2099-12-31',
    Boolean(data.requiresNds || data.requires_nds || false),
    data.maxIncomeLimit || data.max_income_limit || null,
    data.maxEmployeesLimit || data.max_employees_limit || null,
    Boolean(data.requiresOnlineCashier || data.requires_online_cashier || false),
  ];

  const { rows } = await db.query(query, values);
  return transformTaxRegime(rows[0]);
}

/**
 * Обновить режим налогообложения
 */
async function updateTaxRegime(id, data) {
  const fields = [];
  const values = [];
  let paramIndex = 1;

  const updatableFields = [
    { key: 'name', db: 'name' },
    { key: 'description', db: 'description' },
    { key: 'isActive', db: 'is_active' },
    { key: 'hasVat', db: 'has_vat' },
    { key: 'hasProfitTax', db: 'has_profit_tax' },
    { key: 'hasUsnTax', db: 'has_usn_tax' },
    { key: 'hasInsurance', db: 'has_insurance' },
    { key: 'hasNdfl', db: 'has_ndfl' },
    { key: 'defaultVatRate', db: 'default_vat_rate' },
    { key: 'defaultProfitTaxRate', db: 'default_profit_tax_rate' },
    { key: 'defaultUsnRate', db: 'default_usn_rate' },
    { key: 'defaultInsuranceRate', db: 'default_insurance_rate' },
    { key: 'defaultNdflRate', db: 'default_ndfl_rate' },
    { key: 'appliesToLegalForms', db: 'applies_to_legal_forms' },
    { key: 'validFrom', db: 'valid_from' },
    { key: 'validTo', db: 'valid_to' },
    { key: 'requiresNds', db: 'requires_nds' },
    { key: 'maxIncomeLimit', db: 'max_income_limit' },
    { key: 'maxEmployeesLimit', db: 'max_employees_limit' },
    { key: 'requiresOnlineCashier', db: 'requires_online_cashier' },
  ];

  for (const { key, db: dbField } of updatableFields) {
    if (data[key] !== undefined) {
      fields.push(`${dbField} = $${paramIndex}`);
      values.push(data[key]);
      paramIndex++;
    }
  }

  if (fields.length === 0) {
    throw new Error('No fields to update');
  }

  values.push(id);
  const query = `
    UPDATE finance_tax_regimes
    SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
    WHERE id = $${paramIndex}
    RETURNING *
  `;

  const { rows } = await db.query(query, values);
  if (rows.length === 0) return null;
  return transformTaxRegime(rows[0]);
}

/**
 * Удалить режим налогообложения
 */
async function deleteTaxRegime(id) {
  // 1. Сбрасываем ссылки в проектах
  await db.query('UPDATE projects SET tax_regime_id = NULL WHERE tax_regime_id = $1', [id]);

  // 2. Удаляем сам режим (ставки удалятся каскадом на уровне БД)
  const result = await db.query('DELETE FROM finance_tax_regimes WHERE id = $1 RETURNING id', [id]);
  return result.rowCount > 0;
}

// ============================================================
// СТАВКИ НАЛОГОВ (TAX RATES)
// ============================================================

/**
 * Получить все ставки налогов
 */
async function getTaxRates(taxRegimeId) {
  let query;
  let params;

  if (taxRegimeId) {
    query = 'SELECT * FROM finance_tax_rates WHERE tax_regime_id = $1 ORDER BY tax_type, id';
    params = [taxRegimeId];
  } else {
    query = 'SELECT * FROM finance_tax_rates ORDER BY tax_regime_id, tax_type, id';
    params = [];
  }

  const { rows } = await db.query(query, params);
  return rows.map(transformTaxRate);
}

/**
 * Получить ставку налога по ID
 */
async function getTaxRateById(id) {
  const { rows } = await db.query('SELECT * FROM finance_tax_rates WHERE id = $1', [id]);
  if (rows.length === 0) return null;
  return transformTaxRate(rows[0]);
}

/**
 * Создать ставку налога
 */
async function createTaxRate(data) {
  const idRes = await db.query('SELECT COALESCE(MAX(id), 0) + 1 as "nextId" FROM finance_tax_rates');
  const nextId = idRes.rows[0].nextId;

  const query = `
    INSERT INTO finance_tax_rates (
      id, tax_regime_id, tax_type, name, rate, is_fixed, fixed_amount,
      min_base, max_base, description, is_active, effective_from, effective_to,
      rate_value, applies_from, is_default, legal_forms
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
    RETURNING *
  `;

  const values = [
    nextId,
    data.taxRegimeId,
    data.taxType,
    data.name,
    data.rate,
    data.isFixed || false,
    data.fixedAmount || 0,
    data.minBase || null,
    data.maxBase || null,
    data.description || null,
    data.isActive !== false,
    data.effectiveFrom ? parseDate(data.effectiveFrom) : null,
    data.effectiveTo ? parseDate(data.effectiveTo) : null,
    data.rateValue || data.rate || 0,
    data.appliesFrom ? parseDate(data.appliesFrom) : (data.effectiveFrom ? parseDate(data.effectiveFrom) : null),
    Boolean(data.isDefault || false),
    Array.isArray(data.legalForms) ? data.legalForms : (data.legal_forms || []),
  ];

  const { rows } = await db.query(query, values);
  return transformTaxRate(rows[0]);
}

/**
 * Обновить ставку налога
 */
async function updateTaxRate(id, data) {
  const fields = [];
  const values = [];
  let paramIndex = 1;

  const updatableFields = [
    { key: 'name', db: 'name' },
    { key: 'rate', db: 'rate' },
    { key: 'isFixed', db: 'is_fixed' },
    { key: 'fixedAmount', db: 'fixed_amount' },
    { key: 'minBase', db: 'min_base' },
    { key: 'maxBase', db: 'max_base' },
    { key: 'description', db: 'description' },
    { key: 'isActive', db: 'is_active' },
    { key: 'effectiveFrom', db: 'effective_from' },
    { key: 'effectiveTo', db: 'effective_to' },
    { key: 'taxType', db: 'tax_type' },
    { key: 'rateValue', db: 'rate_value' },
    { key: 'appliesFrom', db: 'applies_from' },
    { key: 'isDefault', db: 'is_default' },
    { key: 'legalForms', db: 'legal_forms' },
  ];

  for (const { key, db: dbField } of updatableFields) {
    if (data[key] !== undefined) {
      if (key.includes('From') || key.includes('To')) {
        fields.push(`${dbField} = $${paramIndex}`);
        values.push(data[key] ? parseDate(data[key]) : null);
      } else {
        fields.push(`${dbField} = $${paramIndex}`);
        values.push(data[key]);
      }
      paramIndex++;
    }
  }

  if (fields.length === 0) {
    throw new Error('No fields to update');
  }

  values.push(id);
  const query = `
    UPDATE finance_tax_rates
    SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
    WHERE id = $${paramIndex}
    RETURNING *
  `;

  const { rows } = await db.query(query, values);
  if (rows.length === 0) return null;
  return transformTaxRate(rows[0]);
}

/**
 * Удалить ставку налога
 */
async function deleteTaxRate(id) {
  const result = await db.query('DELETE FROM finance_tax_rates WHERE id = $1 RETURNING id', [id]);
  return result.rowCount > 0;
}

// ============================================================
// ДОПОЛНИТЕЛЬНЫЕ МЕТОДЫ ДЛЯ НАЛОГОВЫХ РЕЖИМОВ (2026)
// ============================================================

/**
 * Получить режимы налогообложения с фильтрацией
 * @param {Object} filters - Фильтры
 * @param {string} filters.legalForm - Код юридической формы
 * @param {Date} filters.date - Дата актуальности (по умолчанию текущая)
 * @param {boolean} filters.activeOnly - Только активные режимы
 * @returns {Promise<Array>} Список режимов
 */
async function getRegimes(filters = {}) {
  let query = 'SELECT * FROM finance_tax_regimes WHERE 1=1';
  const params = [];
  let paramIndex = 1;

  if (filters.activeOnly !== false) {
    query += ` AND is_active = $${paramIndex}`;
    params.push(true);
    paramIndex++;
  }

  if (filters.legalForm) {
    query += ` AND $${paramIndex} = ANY(applies_to_legal_forms)`;
    params.push(filters.legalForm);
    paramIndex++;
  }

  const date = filters.date || new Date();
  query += ` AND (valid_from <= $${paramIndex} OR valid_from IS NULL)`;
  params.push(date);
  paramIndex++;

  query += ` AND (valid_to >= $${paramIndex} OR valid_to IS NULL)`;
  params.push(date);
  paramIndex++;

  query += ' ORDER BY code';

  const { rows } = await db.query(query, params);
  return rows.map(transformTaxRegime);
}

/**
 * Получить режимы, доступные для конкретной юридической формы
 * @param {string} legalFormCode - Код юридической формы
 * @param {Date} date - Дата актуальности
 * @returns {Promise<Array>} Доступные режимы
 */
async function getRegimesByLegalForm(legalFormCode, date = new Date()) {
  return getRegimes({
    legalForm: legalFormCode,
    date,
    activeOnly: true,
  });
}

/**
 * Проверить допустимость режима для контрагента
 * @param {number} contractorId - ID контрагента
 * @param {number} regimeId - ID налогового режима
 * @returns {Promise<Object>} Результат проверки
 */
async function validateRegimeForContractor(contractorId, regimeId) {
  // Получаем контрагента
  const contractorRes = await db.query(
    'SELECT legal_form, NULL as annual_income, NULL as employee_count FROM contractors WHERE id = $1',
    [contractorId]
  );
  if (contractorRes.rows.length === 0) {
    return { valid: false, error: 'Контрагент не найден' };
  }
  const contractor = contractorRes.rows[0];
  const legalForm = contractor.legalForm;

  // Получаем режим
  const regime = await getTaxRegimeById(regimeId);
  if (!regime) {
    return { valid: false, error: 'Режим налогообложения не найден' };
  }

  // Проверка юридической формы
  if (regime.appliesToLegalForms && regime.appliesToLegalForms.length > 0 && legalForm) {
    const applies = regime.appliesToLegalForms.map(x => String(x).toLowerCase());
    const formCode = String(legalForm).toLowerCase();
    
    // Получим группу этой формы из legalFormService
    const legalFormService = require('../../contractors/services/legalFormService');
    const mapping = await legalFormService.getTaxRegimesMapping(legalForm);
    const availableRegimes = mapping?.availableRegimes || [];
    
    const isValid = availableRegimes.some(r => r.id === regimeId);

    if (!isValid) {
      return { valid: false, error: `Режим не доступен для юридической формы "${legalForm}"` };
    }
  }

  // Проверка лимита дохода
  if (regime.maxIncomeLimit && contractor.annual_income) {
    if (contractor.annual_income > regime.maxIncomeLimit) {
      return {
        valid: false,
        error: `Превышен лимит дохода: ${contractor.annual_income} > ${regime.maxIncomeLimit}`,
        limits: { income: { actual: contractor.annual_income, limit: regime.maxIncomeLimit } },
      };
    }
  }

  // Проверка лимита сотрудников
  if (regime.maxEmployeesLimit && contractor.employee_count) {
    if (contractor.employee_count > regime.maxEmployeesLimit) {
      return {
        valid: false,
        error: `Превышен лимит сотрудников: ${contractor.employee_count} > ${regime.maxEmployeesLimit}`,
        limits: { employees: { actual: contractor.employee_count, limit: regime.maxEmployeesLimit } },
      };
    }
  }

  return { valid: true, error: null };
}

/**
 * Обновить юридические формы для налогового режима
 * @param {number} regimeId - ID налогового режима
 * @param {Array<string>} legalForms - Список кодов юридических форм
 * @returns {Promise<Object>} Обновлённый режим
 */
async function updateTaxRegimeLegalForms(regimeId, legalForms) {
  // Валидация входных данных
  if (!Array.isArray(legalForms)) {
    throw new Error('legalForms должен быть массивом');
  }

  // Проверяем существование режима
  const regime = await getTaxRegimeById(regimeId);
  if (!regime) {
    throw new Error('Налоговый режим не найден');
  }

  // Обновляем поле applies_to_legal_forms
  const query = `
    UPDATE finance_tax_regimes
    SET applies_to_legal_forms = $1, updated_at = CURRENT_TIMESTAMP
    WHERE id = $2
    RETURNING *
  `;
  const { rows } = await db.query(query, [legalForms, regimeId]);
  
  if (rows.length === 0) {
    throw new Error('Ошибка при обновлении режима');
  }
  
  return transformTaxRegime(rows[0]);
}

/**
 * Получить историю ставок налога для режима
 * @param {number} taxRegimeId - ID налогового режима
 * @param {Date} fromDate - Начальная дата (опционально)
 * @param {Date} toDate - Конечная дата (опционально)
 * @returns {Promise<Array>} История ставок сгруппированная по типу налога
 */
async function getTaxRatesHistory(taxRegimeId, fromDate = null, toDate = null) {
  // Базовый запрос
  let query = `
    SELECT
      id,
      tax_type,
      rate,
      effective_from,
      effective_to,
      is_active,
      created_at,
      updated_at,
      description,
      min_amount,
      max_amount,
      applies_to_legal_forms
    FROM finance_tax_rates
    WHERE tax_regime_id = $1
  `;
  const params = [taxRegimeId];
  let paramIndex = 2;

  if (fromDate) {
    query += ` AND (effective_to IS NULL OR effective_to >= $${paramIndex})`;
    params.push(fromDate);
    paramIndex++;
  }

  if (toDate) {
    query += ` AND (effective_from IS NULL OR effective_from <= $${paramIndex})`;
    params.push(toDate);
    paramIndex++;
  }

  query += ` ORDER BY tax_type, effective_from DESC`;

  const { rows } = await db.query(query, params);
  return rows.map(transformTaxRate);
}

/**
 * Получить активные налоги для контрагента на дату
 * @param {number} contractorId - ID контрагента
 * @param {Date} date - Дата расчёта
 * @returns {Promise<Array>} Список активных налогов
 */
async function getActiveTaxes(contractorId, date = new Date()) {
  // Получаем режим контрагента
  const contractorRes = await db.query(
    'SELECT tax_regime_id FROM contractors WHERE id = $1',
    [contractorId]
  );
  if (contractorRes.rows.length === 0) {
    return [];
  }
  const regimeId = contractorRes.rows[0].taxRegimeId;
  if (!regimeId) {
    return [];
  }

  // Получаем ставки налогов для режима на дату
  const query = `
    SELECT * FROM finance_tax_rates
    WHERE tax_regime_id = $1
      AND is_active = TRUE
      AND (effective_from IS NULL OR effective_from <= $2)
      AND (effective_to IS NULL OR effective_to >= $2)
    ORDER BY tax_type
  `;
  const { rows } = await db.query(query, [regimeId, date]);
  return rows.map(transformTaxRate);
}

/**
 * Рассчитать налоговую нагрузку для контрагента
 * @param {number} contractorId - ID контрагента
 * @param {Object} period - Период расчёта
 * @param {Date} period.from - Начало периода
 * @param {Date} period.to - Конец периода
 * @param {number} estimatedIncome - Прогнозируемый доход
 * @returns {Promise<Object>} Расчёт налогов
 */
async function calculateTaxBurden(contractorId, period, estimatedIncome) {
  const activeTaxes = await getActiveTaxes(contractorId, period.from);
  const taxes = [];

  for (const tax of activeTaxes) {
    let amount = 0;
    if (tax.isFixed) {
      amount = tax.fixedAmount;
    } else {
      amount = estimatedIncome * (tax.rate / 100);
    }
    taxes.push({
      type: tax.taxType,
      name: tax.name,
      rate: tax.rate,
      amount,
      period: `${period.from.toISOString().slice(0, 7)}`,
    });
  }

  const total = taxes.reduce((sum, t) => sum + t.amount, 0);
  const burdenPercent = estimatedIncome > 0 ? (total / estimatedIncome) * 100 : 0;

  return {
    contractorId,
    period,
    estimatedIncome,
    taxes,
    totalTaxes: total,
    burdenPercent,
  };
}

/**
 * Получить все методы распределения
 */
async function getAllocationMethods() {
  const { rows } = await db.query('SELECT * FROM finance_allocation_methods ORDER BY code');
  return rows.map(transformAllocationMethod);
}

/**
 * Создать метод распределения
 */
async function createAllocationMethod(data) {
  const idRes = await db.query('SELECT COALESCE(MAX(id), 0) + 1 as "nextId" FROM finance_allocation_methods');
  const nextId = idRes.rows[0].nextId;

  const query = `
    INSERT INTO finance_allocation_methods (id, code, name, description, allocation_base, is_active)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *
  `;

  const values = [
    nextId,
    data.code,
    data.name,
    data.description || null,
    data.allocationBase,
    data.isActive !== false,
  ];

  const { rows } = await db.query(query, values);
  return transformAllocationMethod(rows[0]);
}

/**
 * Удалить метод распределения
 */
async function deleteAllocationMethod(id) {
  const result = await db.query('DELETE FROM finance_allocation_methods WHERE id = $1 RETURNING id', [id]);
  return result.rowCount > 0;
}

/**
 * Получить все статьи накладных расходов
 */
async function getOverheadArticles() {
  const { rows } = await db.query(`
    SELECT oa.*, am.name as allocation_method_name
    FROM finance_overhead_articles oa
    LEFT JOIN finance_allocation_methods am ON oa.allocation_method_id = am.id
    ORDER BY oa.priority, oa.code
  `);
  return rows.map(transformOverheadArticle);
}

/**
 * Создать статью накладных расходов
 */
async function createOverheadArticle(data) {
  const idRes = await db.query('SELECT COALESCE(MAX(id), 0) + 1 as "nextId" FROM finance_overhead_articles');
  const nextId = idRes.rows[0].nextId;

  const query = `
    INSERT INTO finance_overhead_articles (
      id, parent_id, code, name, description, article_type,
      allocation_method_id, is_direct, is_active, default_amount, priority
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    RETURNING *
  `;

  const values = [
    nextId,
    data.parentId || null,
    data.code,
    data.name,
    data.description || null,
    data.articleType || 'general',
    data.allocationMethodId || null,
    data.isDirect || false,
    data.isActive !== false,
    data.defaultAmount || 0,
    data.priority || 0,
  ];

  const { rows } = await db.query(query, values);
  return transformOverheadArticle(rows[0]);
}

/**
 * Обновить статью накладных расходов
 */
async function updateOverheadArticle(id, data) {
  const fields = [];
  const values = [];
  let paramIndex = 1;

  const updatableFields = [
    { key: 'name', db: 'name' },
    { key: 'description', db: 'description' },
    { key: 'parentId', db: 'parent_id' },
    { key: 'articleType', db: 'article_type' },
    { key: 'allocationMethodId', db: 'allocation_method_id' },
    { key: 'isDirect', db: 'is_direct' },
    { key: 'isActive', db: 'is_active' },
    { key: 'defaultAmount', db: 'default_amount' },
    { key: 'priority', db: 'priority' },
  ];

  for (const { key, db: dbField } of updatableFields) {
    if (data[key] !== undefined) {
      fields.push(`${dbField} = $${paramIndex}`);
      values.push(data[key]);
      paramIndex++;
    }
  }

  if (fields.length === 0) {
    throw new Error('No fields to update');
  }

  values.push(id);
  const query = `
    UPDATE finance_overhead_articles
    SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
    WHERE id = $${paramIndex}
    RETURNING *
  `;

  const { rows } = await db.query(query, values);
  if (rows.length === 0) return null;
  return transformOverheadArticle(rows[0]);
}

/**
 * Удалить статью накладных расходов
 */
async function deleteOverheadArticle(id) {
  const result = await db.query('DELETE FROM finance_overhead_articles WHERE id = $1 RETURNING id', [id]);
  return result.rowCount > 0;
}

module.exports = {
  // Tax Regimes
  getTaxRegimes,
  getTaxRegimeById,
  createTaxRegime,
  updateTaxRegime,
  deleteTaxRegime,
  getRegimesByLegalForm,
  updateTaxRegimeLegalForms,
  validateRegimeForContractor,
  // Tax Rates
  getTaxRates,
  getTaxRateById,
  createTaxRate,
  updateTaxRate,
  deleteTaxRate,
  getTaxRatesHistory,
  // Contractor Tax Calculations
  getActiveTaxes,
  calculateTaxBurden,
  // Allocation Methods
  getAllocationMethods,
  createAllocationMethod,
  deleteAllocationMethod,
  // Overhead Articles
  getOverheadArticles,
  createOverheadArticle,
  updateOverheadArticle,
  deleteOverheadArticle,
  // Defaults Settings
  getDefaultsSettings,
  updateDefaultsSettings,
};
