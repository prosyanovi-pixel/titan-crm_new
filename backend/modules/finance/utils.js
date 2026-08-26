/**
 * Общие утилиты для финансового модуля
 */

const parseDateValue = (value) => {
  if (!value) return null;
  if (value instanceof Date && !isNaN(value.getTime())) {
    return value.toISOString().split('T')[0];
  }

  const text = String(value).trim();
  if (!text) return null;

  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    return text;
  }

  if (/^\d{2}\.\d{2}\.\d{4}$/.test(text)) {
    const [day, month, year] = text.split('.');
    return `${year}-${month}-${day}`;
  }

  const parsed = new Date(text);
  if (isNaN(parsed.getTime())) return null;
  return parsed.toISOString().split('T')[0];
};

const toNumber = (value, fallback = 0) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
};

const isDatePast = (dateValue) => {
  const parsed = parseDateValue(dateValue);
  if (!parsed) return false;
  const dueDate = new Date(`${parsed}T00:00:00.000Z`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return dueDate < today;
};

const buildInvoiceStatus = ({ currentStatus, amountPaid, amountTotal, dueDate }) => {
  // Сначала проверяем оплату - это главный приоритет
  // Если счет полностью оплачен, статус всегда "paid" независимо от даты
  if (amountPaid >= amountTotal && amountTotal > 0) {
    return 'paid';
  }

  // Частичная оплата
  if (amountPaid > 0 && amountPaid < amountTotal) {
    // Проверяем просрочку для частичной оплаты
    if (isDatePast(dueDate)) {
      return 'overdue';
    }
    return 'partial_paid';
  }

  // Если нет оплаты, проверяем статус и дату
  // Черновик остается черновиком
  if (currentStatus === 'draft') {
    return 'draft';
  }

  // Просрочка проверяется только для отправленных счетов
  if (isDatePast(dueDate)) {
    return 'overdue';
  }

  // Если ничего не подошло - статус "отправлен"
  return 'sent';
};

const mapInvoiceWithDerivedStatus = (invoice) => {
  const amountTotal = toNumber(invoice.amountTotal);
  const amountPaid = toNumber(invoice.amountPaid);
  const amountDue = Math.max(0, amountTotal - amountPaid);

  const computedStatus = buildInvoiceStatus({
    currentStatus: invoice.status,
    amountPaid,
    amountTotal,
    dueDate: invoice.dueDate,
  });

  const result = {
    ...invoice,
    amountTotal,
    amountPaid,
    amountDue,
    status: computedStatus,
    invoiceType: invoice.invoiceType || invoice.invoice_type || 'outgoing',
  };

  // Очистка пустых связей (для Sparse Relations / SmartMetadataGrid)
  const optionalRelations = ['contractorId', 'projectId', 'lawyerUserId', 'sourceTaskId', 'contractId', 'contractor_id', 'project_id', 'lawyer_user_id', 'source_task_id', 'contract_id'];
  optionalRelations.forEach(key => {
    if (result[key] === null || result[key] === '') {
      delete result[key];
    }
  });

  return result;
};


/**
 * Удаляет пустые межисточниковые связи из объекта транзакции/счета (Sparse Relations)
 * @param {Object} entity - Счет или платеж
 * @returns {Object} Очищенный объект
 */
function serializeFinanceEntity(entity) {
  if (!entity) return entity;
  
  const cleanEntity = { ...entity };
  
  // Список всех опциональных межисточниковых полей модуля
  const relationFields = [
    'project_id', 'projectId',
    'task_id', 'taskId',
    'case_id', 'caseId',
    'document_id', 'documentId',
    'lawyer_user_id', 'lawyerUserId',
    'comment'
  ];
  
  relationFields.forEach(field => {
    if (cleanEntity[field] === null || cleanEntity[field] === undefined || cleanEntity[field] === '') {
      delete cleanEntity[field]; // Поле полностью исключается из JSON
    }
  });
  
  return cleanEntity;
}

module.exports = {
  serializeFinanceEntity,
  parseDateValue,
  toNumber,
  isDatePast,
  buildInvoiceStatus,
  mapInvoiceWithDerivedStatus,
};
