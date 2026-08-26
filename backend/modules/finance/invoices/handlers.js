/**
 * Обработчики запросов для счетов
 * Файл: routes/finance/invoices/handlers.js
 */

const db = require('../../../db');
const logger = require('../../../utils/logger');
const { generateNextNumber } = require('../../../utils/numbering');
const { toNumber, buildInvoiceStatus, mapInvoiceWithDerivedStatus, serializeFinanceEntity } = require('../utils');
const { validateInvoiceData } = require('./validators');
const { syncInvoiceToRevenue, syncInvoicePaymentToRevenue } = require('../services/incomeSyncService');
const { generateDocument: generateInvoiceDocument } = require('./documentGenerator');
const {
  upsertCalendarEventForInvoice,
  recalculateInvoice,
  getInvoiceWithDetails,
  getInvoicesWithDetails,
} = require('./services');

/**
 * Получить все счета
 * GET /finance/invoices
 */
async function getAll(req, res) {
  try {
    const invoices = await getInvoicesWithDetails(req.query);
    res.json(invoices.map(serializeFinanceEntity));
  } catch (error) {
    logger.error('Get invoices error', error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * Получить счёт по ID
 * GET /finance/invoices/:id
 */
async function getById(req, res) {
  try {
    const invoice = await getInvoiceWithDetails(req.params.id);
    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }
    res.json(serializeFinanceEntity(invoice));
  } catch (error) {
    logger.error('Get invoice by id error', error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * Создать счёт
 * POST /finance/invoices
 */
async function create(req, res) {
  try {
    const validation = validateInvoiceData(req.body);
    if (!validation.valid) {
      return res.status(400).json({ error: validation.errors.join(', ') });
    }

    const { title, amount_total, issue_date, due_date, currency, description, contractor_id, project_id, lawyer_user_id, source_task_id, invoice_type, status, createCalendarReminder, vat_rate, vat_amount, is_taxable, contract_id } = validation.data;

    const invoiceId = `inv-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const identifier = await generateNextNumber('finance');

    const initialStatus = status || 'draft';
    const { rows } = await db.query(
      `INSERT INTO finance_invoices (
        id, identifier, contractor_id, project_id, lawyer_user_id, source_task_id,
        title, description, currency, amount_total, amount_paid, amount_due,
        issue_date, due_date, status, invoice_type, created_by, updated_by,
        vat_rate, vat_amount, is_taxable, contract_id
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,0,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21)
      RETURNING *`,
      [
        invoiceId,
        identifier,
        contractor_id || null,
        project_id || null,
        lawyer_user_id || null,
        source_task_id || null,
        title,
        description,
        currency,
        amount_total,
        amount_total,
        issue_date,
        due_date,
        initialStatus,
        invoice_type,
        req.headers['x-user-id'] || null,
        req.headers['x-user-id'] || null,
        vat_rate || 0,
        vat_amount || 0,
        is_taxable || false,
        contract_id || null,
      ]
    );

    let invoice = rows[0];

    // Синхронизация с доходами проекта если счёт привязан к проекту
    if (project_id) {
      await syncInvoiceToRevenue({
        id: invoice.id,
        project_id,
        amount_total: invoice.amount_total,
        issue_date: invoice.issue_date,
        due_date: invoice.due_date,
        title: invoice.title,
      });
    }

    // Создаём событие в календаре если нужно
    if (createCalendarReminder !== false || initialStatus === 'sent') {
      const enriched = await db.query(
        `SELECT fi.*, c.name AS contractor_name, p.name AS project_name, u.name AS lawyer_name
         FROM finance_invoices fi
         LEFT JOIN contractors c ON c.id = fi.contractor_id
         LEFT JOIN projects p ON p.id = fi.project_id
         LEFT JOIN users u ON u.id = fi.lawyer_user_id
         WHERE fi.id = $1`,
        [invoice.id]
      );
      await upsertCalendarEventForInvoice(enriched.rows[0]);
      const fresh = await db.query('SELECT * FROM finance_invoices WHERE id = $1', [invoice.id]);
      invoice = fresh.rows[0];
    }

    res.status(201).json(mapInvoiceWithDerivedStatus(invoice));
  } catch (error) {
    logger.error('Create invoice error', error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * Обновить счёт
 * PUT /finance/invoices/:id
 */
async function update(req, res) {
  try {
    const { id } = req.params;
    const existingRes = await db.query('SELECT * FROM finance_invoices WHERE id = $1', [id]);
    if (existingRes.rows.length === 0) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    const existing = existingRes.rows[0];
    const body = req.body || {};

    // Валидация (поддержка camelCase и snake_case)
    const validation = validateInvoiceData({
      title: body.title !== undefined ? body.title : existing.title,
      amount_total: body.amount_total ?? body.amountTotal ?? existing.amount_total,
      amount_paid: body.amount_paid ?? body.amountPaid ?? existing.amount_paid,
      issue_date: body.issue_date ?? body.issueDate ?? existing.issue_date,
      due_date: body.due_date ?? body.dueDate ?? existing.due_date,
      status: body.status !== undefined ? body.status : existing.status,
      ...body,
    });

    if (!validation.valid) {
      return res.status(400).json({ error: validation.errors.join(', ') });
    }

    const { title, amount_total, issue_date, due_date, currency, description, contractor_id, project_id, lawyer_user_id, source_task_id, invoice_type, vat_rate, vat_amount, is_taxable, contract_id } = validation.data;

    // Проверяем, изменился ли identifier
    const newIdentifier = body.identifier !== undefined ? body.identifier : existing.identifier;
    if (newIdentifier !== existing.identifier) {
      logger.info(`Invoice identifier changed from ${existing.identifier} to ${newIdentifier}`);
    }

    const amountTotal = toNumber(amount_total);
    const amountPaid = body.amount_paid !== undefined ? toNumber(body.amount_paid) : toNumber(existing.amount_paid);
    const amountDue = Math.max(0, amountTotal - amountPaid);

    // Логика определения статуса:
    // 1. Если пользователь явно передал статус И это не изменение по amount_paid/amount_due - используем ручной статус
    // 2. Иначе рассчитываем автоматически на основе сумм и даты
    
    let status;
    const isManualStatusChange = body.status && body.status !== existing.status;
    const isPaymentChange = body.amount_paid !== undefined;
    
    if (isManualStatusChange && !isPaymentChange) {
      // Пользователь вручную изменил статус (не через оплату)
      logger.info(`Manual status change: ${existing.status} -> ${body.status}`);
      status = body.status;
    } else {
      // Автоматический расчет статуса
      status = buildInvoiceStatus({
        currentStatus: existing.status,
        amountPaid,
        amountTotal,
        dueDate: due_date,
      });
      logger.info(`Auto status: ${status} (amountPaid=${amountPaid}, amountTotal=${amountTotal}, dueDate=${due_date})`);
    }

    const { rows } = await db.query(
      `UPDATE finance_invoices
       SET contractor_id = $1,
           project_id = $2,
           lawyer_user_id = $3,
           source_task_id = $4,
           title = $5,
           description = $6,
           currency = $7,
           amount_total = $8,
           amount_paid = $9,
           amount_due = $10,
           issue_date = $11,
           due_date = $12,
           status = $13,
           invoice_type = COALESCE($14, invoice_type),
           identifier = $15,
           updated_by = $16,
           updated_at = now(),
           vat_rate = $17,
           vat_amount = $18,
           is_taxable = $19,
           contract_id = $20
       WHERE id = $21
       RETURNING *`,
      [
        contractor_id ?? existing.contractor_id ?? null,
        project_id ?? existing.project_id ?? null,
        lawyer_user_id ?? existing.lawyer_user_id ?? null,
        source_task_id ?? existing.source_task_id ?? null,
        title,
        description ?? existing.description ?? null,
        currency ?? existing.currency,
        amountTotal,
        amountPaid,
        amountDue,
        issue_date,
        due_date,
        status,
        invoice_type ?? null,
        newIdentifier,
        req.headers['x-user-id'] || null,
        vat_rate ?? existing.vat_rate ?? 0,
        vat_amount ?? existing.vat_amount ?? 0,
        is_taxable ?? existing.is_taxable ?? false,
        contract_id ?? existing.contract_id ?? null,
        id,
      ]
    );

    const enriched = await db.query(
      `SELECT fi.*, c.name AS contractor_name, p.name AS project_name, u.name AS lawyer_name
       FROM finance_invoices fi
       LEFT JOIN contractors c ON c.id = fi.contractor_id
       LEFT JOIN projects p ON p.id = fi.project_id
       LEFT JOIN users u ON u.id = fi.lawyer_user_id
       WHERE fi.id = $1`,
      [id]
    );

    await upsertCalendarEventForInvoice(enriched.rows[0]);

    // Синхронизация оплаты с доходом проекта
    const invoice = enriched.rows[0];
    if (invoice.project_id && (body.amount_paid !== undefined || body.status)) {
      await syncInvoicePaymentToRevenue(
        id,
        invoice.amount_paid,
        invoice.status
      );
    }

    res.json(mapInvoiceWithDerivedStatus(rows[0]));
  } catch (error) {
    logger.error('Update invoice error', error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * Отправить счёт (обновить статус)
 * POST /finance/invoices/:id/send
 */
async function send(req, res) {
  try {
    const { id } = req.params;

    const existingRes = await db.query('SELECT * FROM finance_invoices WHERE id = $1', [id]);
    if (existingRes.rows.length === 0) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    const invoice = existingRes.rows[0];
    const updatedRes = await db.query(
      `UPDATE finance_invoices
       SET status = $1,
           updated_by = $2,
           updated_at = now()
       WHERE id = $3
       RETURNING *`,
      [
        invoice.status === 'paid' ? 'paid' : 'sent',
        req.headers['x-user-id'] || null,
        id,
      ]
    );

    const enriched = await db.query(
      `SELECT fi.*, c.name AS contractor_name, p.name AS project_name, u.name AS lawyer_name
       FROM finance_invoices fi
       LEFT JOIN contractors c ON c.id = fi.contractor_id
       LEFT JOIN projects p ON p.id = fi.project_id
       LEFT JOIN users u ON u.id = fi.lawyer_user_id
       WHERE fi.id = $1`,
      [id]
    );

    await upsertCalendarEventForInvoice(enriched.rows[0]);
    res.json(mapInvoiceWithDerivedStatus(updatedRes.rows[0]));
  } catch (error) {
    logger.error('Send invoice error', error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * Пересчитать статус счёта
 * POST /finance/invoices/:id/recalculate-status
 */
async function recalculateStatus(req, res) {
  try {
    const recalculated = await recalculateInvoice(req.params.id);
    if (!recalculated) {
      return res.status(404).json({ error: 'Invoice not found' });
    }
    res.json(mapInvoiceWithDerivedStatus(recalculated));
  } catch (error) {
    logger.error('Recalculate invoice status error', error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * Сгенерировать документ по счёту
 * POST /finance/invoices/:id/generate-document
 */
async function generateDocument(req, res) {
  return generateInvoiceDocument(req, res, { mapInvoiceWithDerivedStatus });
}

/**
 * Удалить счёт
 * DELETE /finance/invoices/:id
 */
async function remove(req, res) {
  try {
    const { id } = req.params;
    const { rows: existingRows } = await db.query(
      'SELECT id, calendar_event_id FROM finance_invoices WHERE id = $1',
      [id]
    );

    if (existingRows.length === 0) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    const existing = existingRows[0];
    const calendarEventId = existing.calendar_event_id || existing.calendarEventId;

    // 1. Сбрасываем ссылки в строках банковских выписок
    await db.query('UPDATE finance_statement_lines SET invoice_id = NULL WHERE invoice_id = $1', [id]);

    // 2. Удаляем записи о сгенерированных документах (счета, акты)
    await db.query('DELETE FROM finance_invoice_documents WHERE invoice_id = $1', [id]);

    // 3. Удаляем связанные платежи (сбрасываем invoice_id, чтобы не удалять сами платежи)
    await db.query('UPDATE finance_payments SET invoice_id = NULL WHERE invoice_id = $1', [id]);

    // 4. Удаляем связанный доход проекта (синхронизация)
    const { syncInvoiceDeleteToRevenue } = require('../services/incomeSyncService');
    await syncInvoiceDeleteToRevenue(id);

    // 5. Удаляем событие в календаре
    if (calendarEventId) {
      await db.query('DELETE FROM calendar_events WHERE id = $1', [calendarEventId]);
    }

    // 6. Удаляем сам счёт
    await db.query('DELETE FROM finance_invoices WHERE id = $1', [id]);

    res.json({ success: true });
  } catch (error) {
    logger.error('Delete invoice error', error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * Массовое обновление счетов
 * POST /finance/invoices/bulk-update
 */
async function bulkUpdate(req, res) {
  try {
    const { ids, updates } = req.body || {};

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'ids array is required' });
    }

    if (!updates || typeof updates !== 'object') {
      return res.status(400).json({ error: 'updates object is required' });
    }

    // Разрешённые поля для массового обновления
    const allowedFields = [
      'status', 'invoice_type', 'contractor_id', 'project_id',
      'lawyer_user_id', 'source_task_id', 'description',
      'currency', 'due_date'
    ];
    const updateKeys = Object.keys(updates).filter(key => allowedFields.includes(key));

    if (updateKeys.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    // Формируем SET clause
    const setClauses = [];
    const values = [];
    let paramIndex = 1;

    updateKeys.forEach(key => {
      setClauses.push(`${key} = $${paramIndex++}`);
      values.push(updates[key]);
    });

    // Добавляем updated_at
    setClauses.push(`updated_at = now()`);

    // Добавляем IDs
    values.push(ids);

    const { rows } = await db.query(
      `UPDATE finance_invoices
       SET ${setClauses.join(', ')}
       WHERE id = ANY($${paramIndex}::text[])
       RETURNING *`,
      values
    );

    // Пересчитываем статусы обновленных счетов
    for (const row of rows) {
      await recalculateInvoice(row.id);
    }

    res.json({
      success: true,
      updated: rows.length,
      message: `Обновлено ${rows.length} счетов`,
    });
  } catch (error) {
    logger.error('Bulk update invoices error', error);
    res.status(500).json({ error: error.message });
  }
}

module.exports = {
  getAll,
  getById,
  create,
  update,
  send,
  recalculateStatus,
  generateDocument,
  remove,
  bulkUpdate,
  // Экспортируем сервисные функции для использования в других местах
  recalculateInvoice,
  upsertCalendarEventForInvoice,
};
