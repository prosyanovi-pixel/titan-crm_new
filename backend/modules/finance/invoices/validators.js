/**
 * Валидация данных для счетов
 * Файл: routes/finance/invoices/validators.js
 */

const { parseDateValue, toNumber } = require('../utils');

/**
 * Валидация создания/обновления счёта
 * @param {Object} data - Данные счёта
 * @returns {Object} - { valid, data, errors }
 */
function validateInvoiceData(data) {
  const errors = [];
  const validated = {};

  // title - обязательное поле
  if (!data.title || String(data.title).trim() === '') {
    errors.push('title is required');
  } else {
    validated.title = String(data.title).trim();
  }

  // amount_total - обязательное число >= 0 (поддержка amount_total и amountTotal)
  const amountTotalValue = data.amount_total ?? data.amountTotal;
  if (amountTotalValue === undefined || amountTotalValue === null) {
    errors.push('amount_total is required');
  } else {
    const amount = toNumber(amountTotalValue);
    if (isNaN(amount) || amount < 0) {
      errors.push('amount_total must be a non-negative number');
    } else {
      validated.amount_total = amount;
    }
  }

  // issue_date - обязательная дата (поддержка issueDate и issue_date)
  const issueDateValue = data.issue_date || data.issueDate;
  if (!issueDateValue) {
    errors.push('issue_date is required');
  } else {
    const parsed = parseDateValue(issueDateValue);
    if (!parsed) {
      errors.push('issue_date must be a valid date');
    } else {
      validated.issue_date = parsed;
    }
  }

  // due_date - обязательная дата (поддержка dueDate и due_date)
  const dueDateValue = data.due_date || data.dueDate;
  if (!dueDateValue) {
    errors.push('due_date is required');
  } else {
    const parsed = parseDateValue(dueDateValue);
    if (!parsed) {
      errors.push('due_date must be a valid date');
    } else {
      validated.due_date = parsed;
    }
  }

  // currency - опционально, по умолчанию RUB
  validated.currency = data.currency || 'RUB';

  // description - опционально
  validated.description = data.description || null;

  // contractor_id - опционально (поддержка contractor_id и contractorId)
  validated.contractor_id = data.contractor_id ?? data.contractorId ?? null;

  // project_id - опционально (поддержка project_id и projectId)
  validated.project_id = data.project_id ?? data.projectId ?? null;

  // lawyer_user_id - опционально (поддержка lawyer_user_id и lawyerUserId/lawyerId)
  validated.lawyer_user_id = data.lawyer_user_id ?? data.lawyerUserId ?? data.lawyerId ?? null;

  // source_task_id - опционально (поддержка source_task_id и sourceTaskId/taskId)
  validated.source_task_id = data.source_task_id ?? data.sourceTaskId ?? data.taskId ?? null;

  // contract_id - опционально (поддержка contract_id и contractId)
  validated.contract_id = data.contract_id ?? data.contractId ?? null;

  // invoice_type - опционально, по умолчанию outgoing (поддержка invoice_type и invoiceType)
  validated.invoice_type = data.invoice_type ?? data.invoiceType ?? 'outgoing';

  // status - опционально, по умолчанию draft
  validated.status = data.status || 'draft';

  // vat_rate - опционально (поддержка vat_rate и vatRate)
  validated.vat_rate = toNumber(data.vat_rate ?? data.vatRate ?? 0);

  // vat_amount - опционально (поддержка vat_amount и vatAmount)
  validated.vat_amount = toNumber(data.vat_amount ?? data.vatAmount ?? 0);

  // is_taxable - опционально (поддержка is_taxable и isTaxable)
  validated.is_taxable = (data.is_taxable ?? data.isTaxable) === true;

  // createCalendarReminder - опционально, по умолчанию true
  validated.createCalendarReminder = data.createCalendarReminder !== false;

  return {
    valid: errors.length === 0,
    data: validated,
    errors,
  };
}

/**
 * Валидация ID счёта
 * @param {string} id - ID счёта
 * @returns {boolean}
 */
function isValidInvoiceId(id) {
  return typeof id === 'string' && id.length > 0;
}

module.exports = {
  validateInvoiceData,
  isValidInvoiceId,
};
