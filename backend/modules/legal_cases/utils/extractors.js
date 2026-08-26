/**
 * Извлечение данных кейса из запроса
 */

const { pickFirstDefined } = require('./utils');

/**
 * Извлекает поля кейса из тела запроса
 * @param {Object} body - Тело запроса
 * @returns {Object} Извлечённые данные
 */
const extractCasePayload = (body = {}) => {
  if (!body || typeof body !== 'object') {
    body = {};
  }

  const finance =
    body.finance && typeof body.finance === 'object' ? body.finance : {};

  return {
    title:               body.title || null,
    type:                body.type || null,
    status:              body.status || null,
    outcome:             body.outcome || null,
    lawyerId:            body.lawyerId || body.lawyer_id || null,
    lawyerName:          body.lawyerName || body.lawyer_name || null,
    client:              body.client || null,
    plaintiff:           body.plaintiff || null,
    defendant:           body.defendant || null,
    judge:               body.judge || null,
    courtName:           body.courtName || body.court_name || null,
    // Номер дела в первой инстанции (фиксированный, не меняется при апелляциях)
    firstInstanceNumber: body.firstInstanceNumber || body.first_instance_number || null,
    // Устаревшее поле — оставляем для обратной совместимости
    caseNumber:          body.caseNumber || body.case_number || null,
    creationDate:        body.creationDate || body.creation_date || null,
    deadline:            body.deadline || null,
    // Поля претензий
    sentDate:            body.sentDate || body.sent_date || null,
    responseDueDate:     body.responseDueDate || body.response_due_date || null,
    price:               body.price || null,
    description:         body.description || null,
    events:              Array.isArray(body.events) ? body.events : [],
    thirdParties:        Array.isArray(body.thirdParties) ? body.thirdParties : [],
    notes:               Array.isArray(body.notes)
      ? body.notes
      : Array.isArray(body.comments) ? body.comments : [],
    documents:           Array.isArray(body.documents) ? body.documents : [],
    recoveredItems:      Array.isArray(body.recoveredItems) ? body.recoveredItems : [],
    expenses:            Array.isArray(body.expenses) ? body.expenses : [],
    claimAmount:         pickFirstDefined(body.claimAmount, finance.claimAmount),
    stateDuty:           pickFirstDefined(body.stateDuty, finance.stateDuty),
    expertiseCost:       pickFirstDefined(body.expertiseCost, finance.expertiseCost),
    otherClaimCosts:     pickFirstDefined(body.otherClaimCosts, finance.otherClaimCosts),
    recoveredAmount:     pickFirstDefined(body.recoveredAmount, finance.recoveredAmount),
    enforcementFee:      pickFirstDefined(body.enforcementFee, finance.enforcementFee),
    executionCosts:      pickFirstDefined(body.executionCosts, finance.executionCosts),
    transportExpenses:   pickFirstDefined(body.transportExpenses, finance.transportExpenses),
    translationExpenses: pickFirstDefined(body.translationExpenses, finance.translationExpenses),
    otherExpenses:       pickFirstDefined(body.otherExpenses, finance.otherExpenses),
  };
};

module.exports = {
  extractCasePayload,
};
