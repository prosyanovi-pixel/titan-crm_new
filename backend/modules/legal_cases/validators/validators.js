/**
 * Валидация данных для юридических дел
 */

const { cleanTextValue, cleanNumberValue } = require('../utils/helpers');

/**
 * Валидация создания/обновления дела
 * @param {Object} data - Данные дела
 * @returns {Object} - { valid, data, errors }
 */
function validateCaseData(data) {
  if (!data || typeof data !== 'object') {
    data = {};
  }
  
  const errors = [];
  const validated = {};

  // title - обязательное поле
  if (!data.title || String(data.title).trim() === '') {
    errors.push('title is required');
  } else {
    validated.title = cleanTextValue(data.title);
  }

  // type - обязательное поле
  if (!data.type || String(data.type).trim() === '') {
    errors.push('type is required');
  } else {
    validated.type = cleanTextValue(data.type);
  }

  // status - обязательное поле
  if (!data.status || String(data.status).trim() === '') {
    errors.push('status is required');
  } else {
    validated.status = cleanTextValue(data.status);
  }

  // lawyer_id - обязательное поле
  if (!data.lawyer_id && !data.lawyerId) {
    errors.push('lawyer_id is required');
  } else {
    validated.lawyer_id = cleanTextValue(data.lawyer_id || data.lawyerId);
  }

  // case_number - обязательное поле
  if (!data.case_number && !data.caseNumber) {
    errors.push('case_number is required');
  } else {
    validated.case_number = cleanTextValue(data.case_number || data.caseNumber);
  }

  // creation_date - обязательная дата
  if (!data.creation_date && !data.creationDate) {
    errors.push('creation_date is required');
  } else {
    validated.creation_date = cleanTextValue(data.creation_date || data.creationDate);
  }

  // deadline - опционально
  validated.deadline = cleanTextValue(data.deadline) || null;

  // client - опционально
  validated.client = cleanTextValue(data.client) || null;

  // plaintiff - опционально
  validated.plaintiff = cleanTextValue(data.plaintiff) || null;

  // defendant - опционально
  validated.defendant = cleanTextValue(data.defendant) || null;

  // judge - опционально
  validated.judge = cleanTextValue(data.judge) || null;

  // court_name - опционально
  validated.court_name = cleanTextValue(data.court_name || data.courtName) || null;

  // price - опционально
  validated.price = cleanNumberValue(data.price) || null;

  // description - опционально
  validated.description = cleanTextValue(data.description) || null;

  // outcome - опционально
  validated.outcome = cleanTextValue(data.outcome) || null;

  // lawyer_name - опционально
  validated.lawyer_name = cleanTextValue(data.lawyer_name || data.lawyerName) || null;

  return {
    valid: errors.length === 0,
    data: validated,
    errors,
  };
}

/**
 * Валидация финансового дела
 * @param {Object} data - Финансовые данные
 * @returns {Object} - { valid, data, errors }
 */
function validateCaseFinancials(data) {
  const validated = {};

  // Claim amount
  validated.claim_amount = cleanNumberValue(data.claim_amount?.amount || data.claimAmount?.amount);
  validated.claim_currency = cleanTextValue(data.claim_amount?.currency || data.claimAmount?.currency) || 'RUB';

  // State duty
  validated.state_duty = cleanNumberValue(data.state_duty || data.stateDuty);

  // Expertise cost
  validated.expertise_cost = cleanNumberValue(data.expertise_cost || data.expertiseCost);

  // Other claim costs
  validated.other_claim_costs = cleanNumberValue(data.other_claim_costs || data.otherClaimCosts);

  // Recovered amount
  validated.recovered_amount = cleanNumberValue(data.recovered_amount?.amount || data.recoveredAmount?.amount);
  validated.recovered_currency = cleanTextValue(data.recovered_amount?.currency || data.recoveredAmount?.currency) || 'RUB';

  // Enforcement fee
  validated.enforcement_fee = cleanNumberValue(data.enforcement_fee || data.enforcementFee);

  // Execution costs
  validated.execution_costs = cleanNumberValue(data.execution_costs || data.executionCosts);

  // Transport expenses
  validated.transport_expenses = cleanNumberValue(data.transport_expenses || data.transportExpenses);

  // Translation expenses
  validated.translation_expenses = cleanNumberValue(data.translation_expenses || data.translationExpenses);

  // Other expenses
  validated.other_expenses = cleanNumberValue(data.other_expenses || data.otherExpenses);

  return {
    valid: true,
    data: validated,
    errors: [],
  };
}

/**
 * Валидация ID дела
 * @param {string} id - ID дела
 * @returns {boolean}
 */
function isValidCaseId(id) {
  return typeof id === 'string' && id.length > 0;
}

module.exports = {
  validateCaseData,
  validateCaseFinancials,
  isValidCaseId,
};
