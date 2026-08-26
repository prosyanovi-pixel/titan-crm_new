/**
 * Валидатор для налоговых операций контрагентов
 * Проверка возможности смены налогового режима, проверка лимитов
 */

const db = require('../../../db');
const TaxRegimeValidator = require('../../finance/validators/TaxRegimeValidator');

const ContractorTaxValidator = {
  /**
   * Проверка возможности смены налогового режима
   * @param {number} contractorId - ID контрагента
   * @param {number} newRegimeId - ID нового налогового режима
   * @returns {Promise<Object>} Результат проверки
   */
  async validateRegimeChange(contractorId, newRegimeId) {
    const { rows } = await db.query('SELECT * FROM contractors WHERE id = $1', [contractorId]);
    const contractor = rows[0];
    if (!contractor) {
      return { valid: false, error: 'Контрагент не найден' };
    }
    
    // Проверка юридической формы
    if (!contractor.legalForm) {
      return { valid: false, error: 'У контрагента не указана юридическая форма' };
    }
    
    // Проверка доступности режима
    const regimeCheck = await TaxRegimeValidator.validateForLegalForm(
      newRegimeId, 
      contractor.legalForm
    );
    
    if (!regimeCheck.valid) {
      return regimeCheck;
    }
    
    // Проверка лимитов (если есть данные)
    const regimeRes = await db.query(
      'SELECT * FROM finance_tax_regimes WHERE id = $1',
      [newRegimeId]
    );
    if (regimeRes.rows.length === 0) {
      return { valid: false, error: 'Налоговый режим не найден' };
    }
    
    const regime = regimeRes.rows[0];
    const limitsCheck = await this.checkLimits(contractor, regime);
    
    // Риск-проверка НПД (Самозанятый)
    if (regime.code === 'NPD') {
      if (contractor.is_employee) {
        limitsCheck.warnings.push('Риск! Данное лицо является вашим сотрудником. Выплаты по НПД бывшим и текущим сотрудникам в течение 2 лет приравниваются ФНС к трудовым.');
      } else {
        const empRes = await db.query('SELECT 1 FROM employees WHERE contractor_id = $1 LIMIT 1', [contractorId]);
        if (empRes.rows.length > 0) {
          limitsCheck.warnings.push('Риск! Данное лицо является (или являлось) вашим сотрудником. Выплаты по НПД бывшим и текущим сотрудникам в течение 2 лет приравниваются ФНС к трудовым.');
        }
      }
    }
    
    return {
      valid: limitsCheck.passed,
      error: limitsCheck.passed ? null : limitsCheck.message,
      warnings: limitsCheck.warnings,
      details: limitsCheck.details,
    };
  },
  
  /**
   * Проверка соответствия лимитам
   * @param {Object} contractor - Данные контрагента
   * @param {Object} regime - Данные налогового режима
   * @returns {Object} Результат проверки
   */
  async checkLimits(contractor, regime) {
    const result = { 
      passed: true, 
      message: null, 
      warnings: [],
      details: {
        income: { actual: null, limit: null, passed: true },
        employees: { actual: null, limit: null, passed: true },
        onlineCashier: { required: false, has: null, passed: true },
      },
    };
    
    // Проверка лимита дохода
    if (regime.max_income_limit && contractor.annual_income) {
      result.details.income.actual = contractor.annual_income;
      result.details.income.limit = regime.max_income_limit;
      
      if (contractor.annual_income > regime.max_income_limit) {
        result.passed = false;
        result.details.income.passed = false;
        result.message = `Превышен лимит дохода: ${contractor.annual_income} > ${regime.max_income_limit}`;
      }
    }
    
    // Проверка лимита сотрудников
    if (regime.max_employees_limit && contractor.employee_count) {
      result.details.employees.actual = contractor.employee_count;
      result.details.employees.limit = regime.max_employees_limit;
      
      if (contractor.employee_count > regime.max_employees_limit) {
        result.passed = false;
        result.details.employees.passed = false;
        result.message = `Превышен лимит сотрудников: ${contractor.employee_count} > ${regime.max_employees_limit}`;
      }
    }
    
    // Предупреждение о необходимости онлайн-кассы
    if (regime.requires_online_cashier) {
      result.details.onlineCashier.required = true;
      result.details.onlineCashier.has = contractor.has_online_cashier || false;
      result.details.onlineCashier.passed = contractor.has_online_cashier === true;
      
      if (!contractor.has_online_cashier) {
        result.warnings.push('Для данного режима требуется онлайн-касса');
      }
    }
    
    // Проверка дат действия режима
    const today = new Date();
    if (regime.valid_from && new Date(regime.valid_from) > today) {
      result.warnings.push(`Режим вступит в силу только с ${regime.valid_from}`);
    }
    
    if (regime.valid_to && new Date(regime.valid_to) < today) {
      result.passed = false;
      result.message = `Режим утратил силу с ${regime.valid_to}`;
    }
    
    return result;
  },
  
  /**
   * Проверка данных контрагента для налогового учёта
   * @param {Object} contractorData - Данные контрагента
   * @returns {Array} Массив ошибок
   */
  validateContractorForTax(contractorData) {
    const errors = [];
    
    if (contractorData.legalForm && !contractorData.legalForm.match(/^[A-Z]{2,10}$/)) {
      errors.push('Некорректный код юридической формы');
    }
    
    if (contractorData.annualIncome !== undefined && contractorData.annualIncome < 0) {
      errors.push('Годовой доход не может быть отрицательным');
    }
    
    if (contractorData.employeeCount !== undefined && contractorData.employeeCount < 0) {
      errors.push('Количество сотрудников не может быть отрицательным');
    }
    
    return errors;
  },
  
  /**
   * Проверка, можно ли удалить налоговую историю контрагента
   * @param {number} contractorId - ID контрагента
   * @returns {Promise<Object>} Результат проверки
   */
  async canClearTaxHistory(contractorId) {
    // Проверяем, есть ли активные налоговые обязательства
    const activeTaxesRes = await db.query(`
      SELECT COUNT(*) as count 
      FROM contractor_tax_obligations 
      WHERE contractor_id = $1 AND status IN ('pending', 'due')
    `, [contractorId]);
    
    const activeCount = parseInt(activeTaxesRes.rows[0]?.count || 0, 10);
    
    return {
      canClear: activeCount === 0,
      message: activeCount > 0 
        ? `У контрагента есть ${activeCount} активных налоговых обязательств` 
        : null,
      activeObligations: activeCount,
    };
  },
};

module.exports = ContractorTaxValidator;