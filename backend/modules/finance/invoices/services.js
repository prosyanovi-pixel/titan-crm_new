/**
 * Бизнес-логика для счетов
 * Файл: routes/finance/invoices/services.js
 */

const db = require('../../../db');
const { parseDateValue, toNumber, buildInvoiceStatus, mapInvoiceWithDerivedStatus, isDatePast } = require('../utils');
const logger = require('../../../utils/logger');

/**
 * Создание или обновление события в календаре для счета
 * @param {Object} invoiceRow - Данные счёта
 * @returns {Promise<string|null>} - ID события или null
 */
const upsertCalendarEventForInvoice = async (invoiceRow) => {
  const calendarPayload = {
    title: `Оплата счета ${invoiceRow.identifier}`,
    date: parseDateValue(invoiceRow.dueDate),
    type: 'reminder',
    status: invoiceRow.status === 'paid' ? 'completed' : 'planned',
    time: '10:00',
    description: `Счет: ${invoiceRow.identifier}\nСумма: ${invoiceRow.amountTotal} ${invoiceRow.currency}\nКонтрагент: ${invoiceRow.contractorName || '—'}\nПроект: ${invoiceRow.projectName || '—'}`,
    assignee: null, // ID пользователя, а не имя
    client: null,   // ID контрагента, а не имя
    createFollowUpTask: false,
    notifyClient: false,
    notifyAssignee: true,
  };

  if (!calendarPayload.date) return null;

  if (invoiceRow.calendarEventId) {
    const { rows } = await db.query(
      `UPDATE calendar_events
       SET title = $1, date = $2, type = $3, status = $4, time = $5, description = $6
       WHERE id = $7
       RETURNING id`,
      [
        calendarPayload.title,
        calendarPayload.date,
        calendarPayload.type,
        calendarPayload.status,
        calendarPayload.time,
        calendarPayload.description,
        invoiceRow.calendarEventId,
      ]
    );

    if (rows.length > 0) {
      return rows[0].id;
    }
  }

  const eventId = `evt-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  await db.query(
    `INSERT INTO calendar_events (
      id, title, date, type, status, time, description,
      notify_client, notify_assignee, create_follow_up_task
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
    [
      eventId,
      calendarPayload.title,
      calendarPayload.date,
      calendarPayload.type,
      calendarPayload.status,
      calendarPayload.time,
      calendarPayload.description,
      false,
      true,
      false,
    ]
  );

  await db.query('UPDATE finance_invoices SET calendar_event_id = $1 WHERE id = $2', [eventId, invoiceRow.id]);
  return eventId;
};

/**
 * Пересчет статуса и сумм счета на основе платежей
 * @param {string} invoiceId - ID счёта
 * @returns {Promise<Object|null>} - Обновлённый счёт или null
 */
const recalculateInvoice = async (invoiceId) => {
  const invoiceRes = await db.query('SELECT * FROM finance_invoices WHERE id = $1', [invoiceId]);
  if (invoiceRes.rows.length === 0) return null;

  const invoice = invoiceRes.rows[0];
  const paymentsRes = await db.query(
    `SELECT COALESCE(SUM(amount), 0) AS paid
     FROM finance_payments
     WHERE invoice_id = $1 AND kind = 'income'`,
    [invoiceId]
  );

  // pg возвращает колонки в camelCase
  const amountTotal = toNumber(invoice.amountTotal || invoice.amount_total);
  const amountPaid = toNumber(paymentsRes.rows[0]?.paid);
  const amountDue = Math.max(0, amountTotal - amountPaid);
  const status = buildInvoiceStatus({
    currentStatus: invoice.status,
    amountPaid,
    amountTotal,
    dueDate: invoice.dueDate || invoice.due_date,
  });

  // Определяем дату просрочки
  let overdueSince = null;
  if (status === 'overdue') {
    const dueDate = parseDateValue(invoice.dueDate || invoice.due_date);
    if (dueDate && isDatePast(dueDate)) {
      overdueSince = dueDate;
    }
  }

  // Если счет полностью оплачен или это частичная оплата без просрочки - сбрасываем дату просрочки
  if (status === 'paid' || status === 'partial_paid' || status === 'sent') {
    overdueSince = null;
  }

  const updated = await db.query(
    `UPDATE finance_invoices
     SET amount_paid = $1,
         amount_due = $2,
         status = $3,
         overdue_since = $4,
         updated_at = now()
     WHERE id = $5
     RETURNING *`,
    [amountPaid, amountDue, status, overdueSince, invoiceId]
  );

  const updatedInvoice = updated.rows[0];

  // Синхронизация оплаты с доходом проекта
  if (updatedInvoice.projectId || updatedInvoice.project_id) {
    try {
      const { syncInvoicePaymentToRevenue } = require('../services/incomeSyncService');
      await syncInvoicePaymentToRevenue(
        invoiceId,
        amountPaid,
        status
      );
    } catch (err) {
      logger.error('Error syncing recalculated invoice to revenue:', err);
    }
  }

  return updatedInvoice;
};

/**
 * Получить счёт с обогащёнными данными
 * @param {string} id - ID счёта
 * @returns {Promise<Object|null>}
 */
const getInvoiceWithDetails = async (id) => {
  const { rows } = await db.query(
    `SELECT fi.*, 
            c.name AS contractor_name, 
            c.legal_form AS contractor_legal_form,
            tr.name AS tax_regime_name,
            p.name AS project_name, 
            u.name AS lawyer_name, 
            t.title AS source_task_title
     FROM finance_invoices fi
     LEFT JOIN contractors c ON c.id = fi.contractor_id
     LEFT JOIN finance_tax_regimes tr ON tr.id = c.tax_regime_id
     LEFT JOIN projects p ON p.id = fi.project_id
     LEFT JOIN users u ON u.id = fi.lawyer_user_id
     LEFT JOIN tasks t ON t.id = fi.source_task_id
     WHERE fi.id = $1`,
    [id]
  );

  if (rows.length === 0) return null;
  return mapInvoiceWithDerivedStatus(rows[0]);
};

/**
 * Получить все счета с фильтрацией
 * @param {Object} filters - Фильтры
 * @returns {Promise<Array>}
 */
const getInvoicesWithDetails = async (filters = {}) => {
  const { status, contractorId, projectId, lawyerUserId, dateFrom, dateTo, overdueOnly } = filters;

  const conditions = [];
  const params = [];

  if (status) {
    params.push(status);
    conditions.push(`fi.status = $${params.length}`);
  }

  if (contractorId) {
    params.push(contractorId);
    conditions.push(`fi.contractor_id = $${params.length}`);
  }

  if (projectId) {
    params.push(projectId);
    conditions.push(`fi.project_id = $${params.length}`);
  }

  if (lawyerUserId) {
    params.push(lawyerUserId);
    conditions.push(`fi.lawyer_user_id = $${params.length}`);
  }

  if (dateFrom) {
    params.push(parseDateValue(dateFrom));
    conditions.push(`fi.issue_date >= $${params.length}`);
  }

  if (dateTo) {
    params.push(parseDateValue(dateTo));
    conditions.push(`fi.issue_date <= $${params.length}`);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const { rows } = await db.query(
    `SELECT fi.*, 
            c.name AS contractor_name, 
            c.legal_form AS contractor_legal_form,
            tr.name AS tax_regime_name,
            p.name AS project_name, 
            u.name AS lawyer_name, 
            t.title AS source_task_title
     FROM finance_invoices fi
     LEFT JOIN contractors c ON c.id = fi.contractor_id
     LEFT JOIN finance_tax_regimes tr ON tr.id = c.tax_regime_id
     LEFT JOIN projects p ON p.id = fi.project_id
     LEFT JOIN users u ON u.id = fi.lawyer_user_id
     LEFT JOIN tasks t ON t.id = fi.source_task_id
     ${where}
     ORDER BY fi.created_at DESC`,
    params
  );

  const mapped = rows.map(mapInvoiceWithDerivedStatus);

  if (String(overdueOnly) === 'true') {
    return mapped.filter(i => i.status === 'overdue');
  }

  return mapped;
};

module.exports = {
  upsertCalendarEventForInvoice,
  recalculateInvoice,
  getInvoiceWithDetails,
  getInvoicesWithDetails,
};
