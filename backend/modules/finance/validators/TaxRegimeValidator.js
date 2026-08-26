/**
 * Валидатор для налоговых режимов
 * Проверка данных при создании/обновлении режима и проверка допустимости для юридических форм
 */

const db = require('../../../db');

const TaxRegimeValidator = {
  /**
   * Проверка данных при создании/обновлении режима
   * @param {Object} data - Данные режима
   * @returns {Array} Массив ошибок (пустой, если ошибок нет)
   */
  validateCreate(data) {
    const errors = [];
    
    if (!data.code) errors.push('Код режима обязателен');
    if (!data.name) errors.push('Название режима обязательно');
    
    // Проверка юридических форм
    if (data.appliesToLegalForms && !Array.isArray(data.appliesToLegalForms)) {
      errors.push('appliesToLegalForms должен быть массивом');
    }
    
    // Проверка лимитов
    if (data.maxIncomeLimit !== undefined && data.maxIncomeLimit < 0) {
      errors.push('Лимит дохода не может быть отрицательным');
    }
    
    if (data.maxEmployeesLimit !== undefined && data.maxEmployeesLimit < 0) {
      errors.push('Лимит сотрудников не может быть отрицательным');
    }
    
    // Проверка дат
    if (data.validFrom && data.validTo) {
      const from = new Date(data.validFrom);
      const to = new Date(data.validTo);
      if (from > to) {
        errors.push('Дата начала действия не может быть позже даты окончания');
      }
    }
    
    // Проверка ставок по умолчанию
    const rateFields = [
      'defaultVatRate', 'defaultProfitTaxRate', 'defaultUsnRate',
      'defaultInsuranceRate', 'defaultNdflRate',
    ];
    rateFields.forEach(field => {
      if (data[field] !== undefined && (data[field] < 0 || data[field] > 100)) {
        errors.push(`Поле ${field} должно быть в диапазоне 0-100`);
      }
    });
    
    return errors;
  },
  
  /**
   * Проверка допустимости режима для юридической формы
   * @param {number} regimeId - ID налогового режима
   * @param {string} legalFormCode - Код юридической формы
   * @returns {Promise<Object>} Результат проверки
   */
  async validateForLegalForm(regimeId, legalFormCode) {
    const legalFormService = require('../../contractors/services/legalFormService');
    const mapping = await legalFormService.getTaxRegimesMapping(legalFormCode);
    
    if (!mapping) {
      return { valid: false, error: 'Юридическая форма не найдена' };
    }
    
    const isAllowed = mapping.availableRegimes.some(r => Number(r.id) === Number(regimeId));
    
    return {
      valid: isAllowed,
      error: isAllowed ? null : 'Режим не доступен для данной юридической формы',
      details: {
        regimeId,
        legalFormCode,
      },
    };
  },
  
  /**
   * Проверка уникальности кода режима
   * @param {string} code - Код режима
   * @param {number} excludeId - ID режима для исключения (при обновлении)
   * @returns {Promise<boolean>} true если код уникален
   */
  async isCodeUnique(code, excludeId = null) {
    let query = 'SELECT COUNT(*) as count FROM finance_tax_regimes WHERE code = $1';
    const params = [code];
    
    if (excludeId) {
      query += ' AND id != $2';
      params.push(excludeId);
    }
    
    const { rows } = await db.query(query, params);
    return parseInt(rows[0].count, 10) === 0;
  },
  
  /**
   * Проверка возможности удаления режима (нет связанных записей)
   * @param {number} regimeId - ID режима
   * @returns {Promise<Object>} Результат проверки
   */
  async validateDeletion(regimeId) {
    // Проверяем, используется ли режим у контрагентов
    const contractorsRes = await db.query(
      'SELECT COUNT(*) as count FROM contractors WHERE tax_regime_id = $1',
      [regimeId]
    );
    const contractorsCount = parseInt(contractorsRes.rows[0].count, 10);
    
    // Проверяем, есть ли связанные ставки налогов
    const ratesRes = await db.query(
      'SELECT COUNT(*) as count FROM finance_tax_rates WHERE tax_regime_id = $1',
      [regimeId]
    );
    const ratesCount = parseInt(ratesRes.rows[0].count, 10);
    
    const errors = [];
    if (contractorsCount > 0) {
      errors.push(`Режим используется у ${contractorsCount} контрагентов`);
    }
    if (ratesCount > 0) {
      errors.push(`Режим имеет ${ratesCount} связанных ставок налогов`);
    }
    
    return {
      canDelete: errors.length === 0,
      errors,
      counts: { contractors: contractorsCount, rates: ratesCount },
    };
  },
};

module.exports = TaxRegimeValidator;