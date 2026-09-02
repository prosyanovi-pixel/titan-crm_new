const express = require('express');

const db = require('../../../db');
const logger = require('../../../utils/logger');
const { parseDateValue, toNumber } = require('../utils');
const { recalculateInvoice } = require('../invoices/services');

const router = express.Router();

router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const body = req.body || {};

    logger.info(`Update payment ${id}:`, JSON.stringify(body));

    const existing = await db.query('SELECT * FROM finance_payments WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    const row = existing.rows[0];

    const oldInvoiceId = row.invoiceId;
    let nextInvoiceId = body.invoiceId !== undefined ? body.invoiceId : (oldInvoiceId ?? null);

    if (nextInvoiceId === '') nextInvoiceId = null;

    const paymentDate = parseDateValue(body.paymentDate ?? row.paymentDate);

    const { rows } = await db.query(
      `UPDATE finance_payments
       SET kind = $1,
           invoice_id = $2,
           project_id = $3,
           task_id = $4,
           contractor_id = $5,
           amount = $6,
           currency = $7,
           payment_date = $8,
           method = $9,
           comment = $10,
           category_id = $11,
           contract_id = $12,
           campaign_id = $13
       WHERE id = $14
       RETURNING *`,
      [
        body.kind ?? row.kind,
        nextInvoiceId,
        body.projectId !== undefined ? (body.projectId || null) : (row.projectId ?? null),
        body.taskId !== undefined ? (body.taskId || null) : (row.taskId ?? null),
        body.contractorId !== undefined ? (body.contractorId || null) : (row.contractorId ?? null),
        toNumber(body.amount ?? row.amount),
        body.currency ?? row.currency,
        paymentDate ?? row.paymentDate,
        body.method !== undefined ? body.method : (row.method ?? null),
        body.comment !== undefined ? body.comment : (row.comment ?? null),
        body.categoryId !== undefined ? (body.categoryId || null) : (row.categoryId ?? null),
        body.contractId !== undefined ? (body.contractId || null) : (row.contractId ?? null),
        body.campaignId !== undefined ? (body.campaignId || null) : (row.campaignId ?? null),
        id,
      ]
    );

    if (oldInvoiceId && String(oldInvoiceId) !== String(nextInvoiceId)) {
      logger.info(`Recalculating old invoice ${oldInvoiceId}`);
      await recalculateInvoice(oldInvoiceId).catch(e => logger.error('Recalculate error:', e));
    }
    if (nextInvoiceId) {
      logger.info(`Recalculating invoice ${nextInvoiceId}`);
      await recalculateInvoice(nextInvoiceId).catch(e => logger.error('Recalculate error:', e));
    }

    res.json(rows[0]);
  } catch (error) {
    logger.error(`Error updating payment ${req.params.id}:`, error);
    if (error && error.code === '23505' && String(error.constraint).includes('idx_finance_payments_unique')) {
      return res.status(400).json({ error: 'Платеж с такими параметрами (сумма, дата, контрагент, тип) уже существует.' });
    }
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await db.query('SELECT * FROM finance_payments WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    const invoiceId = existing.rows[0].invoiceId;

    // 1. Сбрасываем ссылки в строках банковских выписок
    await db.query('UPDATE finance_statement_lines SET payment_id = NULL WHERE payment_id = $1', [id]);

    // 2. Удаляем сам платеж
    await db.query('DELETE FROM finance_payments WHERE id = $1', [id]);

    if (invoiceId) {
      await recalculateInvoice(invoiceId).catch(e => logger.error('Recalculate error:', e));
    }

    res.json({ success: true });
  } catch (error) {
    logger.error(`Error deleting payment ${req.params.id}:`, error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/:id/unlink-from-invoice', async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await db.query('SELECT * FROM finance_payments WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    const row = existing.rows[0];
    const invoiceId = row.invoiceId;

    if (!invoiceId) {
      return res.json({
        success: true,
        message: 'Payment is not linked to any invoice',
        payment: row,
      });
    }

    await db.query('UPDATE finance_payments SET invoice_id = NULL WHERE id = $1', [id]);
    await db.query('UPDATE finance_statement_lines SET payment_id = NULL, invoice_id = NULL, reconcile_status = \'unmatched\' WHERE payment_id = $1', [id]);

    logger.info(`Recalculating invoice ${invoiceId} after payment unlink`);
    await recalculateInvoice(invoiceId).catch(e => logger.error('Recalculate error:', e));

    res.json({
      success: true,
      message: 'Payment unlinked from invoice',
      previousInvoiceId: invoiceId,
      payment: { ...row, invoiceId: null },
    });
  } catch (error) {
    logger.error(`Error unlinking payment ${req.params.id}:`, error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/bulk-update', async (req, res) => {
  try {
    const { ids, updates } = req.body || {};

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'ids array is required' });
    }

    if (!updates || typeof updates !== 'object') {
      return res.status(400).json({ error: 'updates object is required' });
    }

    const allowedFields = [
      'kind', 'category_id', 'contractor_id', 'project_id',
      'task_id', 'method', 'comment', 'currency', 'contract_id', 'campaign_id'
    ];
    const fieldMapping = {
      kind: 'kind',
      categoryId: 'category_id',
      contractorId: 'contractor_id',
      contractId: 'contract_id',
      projectId: 'project_id',
      taskId: 'task_id',
      method: 'method',
      comment: 'comment',
      currency: 'currency',
      campaignId: 'campaign_id',
    };

    const setClauses = [];
    const values = [];
    let paramIndex = 1;

    Object.keys(updates).forEach(key => {
      const dbField = fieldMapping[key];
      if (dbField && allowedFields.includes(dbField)) {
        setClauses.push(`${dbField} = $${paramIndex++}`);
        values.push(updates[key]);
      }
    });

    if (setClauses.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    values.push(ids);

    const { rows } = await db.query(
      `UPDATE finance_payments
       SET ${setClauses.join(', ')}
       WHERE id = ANY($${paramIndex}::text[])
       RETURNING *`,
      values
    );

    const invoiceIds = rows.map(r => r.invoiceId).filter(Boolean);
    for (const invoiceId of [...new Set(invoiceIds)]) {
      await recalculateInvoice(invoiceId).catch(e => logger.error('Recalculate error:', e));
    }

    res.json({
      success: true,
      updated: rows.length,
      message: `Обновлено ${rows.length} платежей`,
    });
  } catch (error) {
    logger.error('Bulk update payments error', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/bulk-delete', async (req, res) => {
  try {
    const { ids } = req.body || {};

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'ids array is required' });
    }

    // 1. Находим все затронутые счета перед удалением
    const { rows: payments } = await db.query(
      'SELECT invoice_id FROM finance_payments WHERE id = ANY($1::text[]) AND invoice_id IS NOT NULL',
      [ids]
    );
    const invoiceIds = [...new Set(payments.map(p => p.invoiceId))];

    // 2. Сбрасываем ссылки в строках банковских выписок
    await db.query(
      'UPDATE finance_statement_lines SET payment_id = NULL WHERE payment_id = ANY($1::text[])',
      [ids]
    );

    // 3. Удаляем сами платежи
    const { rowCount } = await db.query(
      'DELETE FROM finance_payments WHERE id = ANY($1::text[])',
      [ids]
    );

    // 4. Пересчитываем затронутые счета
    for (const invId of invoiceIds) {
      await recalculateInvoice(invId).catch(e => logger.error(`Error recalculating invoice ${invId}:`, e));
    }

    res.json({
      success: true,
      deletedCount: rowCount,
      message: `Удалено ${rowCount} платежей`,
    });
  } catch (error) {
    logger.error('Bulk delete payments error', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;