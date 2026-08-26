const express = require('express');

const db = require('../../../db');
const logger = require('../../../utils/logger');
const { serializeFinanceEntity } = require('../utils');
const { parseDateValue, toNumber } = require('../utils');
const { recalculateInvoice } = require('../invoices/services');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const { kind, invoiceId, projectId, contractorId, dateFrom, dateTo } = req.query;

    const conditions = [];
    const params = [];

    if (kind) {
      params.push(kind);
      conditions.push(`fp.kind = $${params.length}`);
    }

    if (invoiceId) {
      params.push(invoiceId);
      conditions.push(`fp.invoice_id = $${params.length}`);
    }

    if (projectId) {
      params.push(projectId);
      conditions.push(`fp.project_id = $${params.length}`);
    }

    const { taskId, campaignId } = req.query;
    if (taskId) {
      params.push(taskId);
      conditions.push(`fp.task_id = $${params.length}`);
    }

    if (campaignId) {
      params.push(campaignId);
      conditions.push(`fp.campaign_id = $${params.length}`);
    }

    if (contractorId) {
      params.push(contractorId);
      conditions.push(`fp.contractor_id = $${params.length}`);
    }

    if (dateFrom) {
      params.push(parseDateValue(dateFrom));
      conditions.push(`fp.payment_date >= $${params.length}`);
    }

    if (dateTo) {
      params.push(parseDateValue(dateTo));
      conditions.push(`fp.payment_date <= $${params.length}`);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const { rows } = await db.query(
      `SELECT fp.*, fi.identifier AS invoice_identifier, p.name AS project_name,
              c.name AS contractor_name, t.title AS task_title, m.name AS campaign_name
       FROM finance_payments fp
       LEFT JOIN finance_invoices fi ON fi.id = fp.invoice_id
       LEFT JOIN projects p ON p.id = fp.project_id
       LEFT JOIN contractors c ON c.id = fp.contractor_id
       LEFT JOIN tasks t ON t.id = fp.task_id
       LEFT JOIN marketing_campaigns m ON m.id = fp.campaign_id
       ${where}
       ORDER BY fp.payment_date DESC, fp.created_at DESC`,
      params
    );

    res.json(rows);
  } catch (error) {
    logger.error('Error fetching payments:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const {
      kind,
      invoiceId,
      projectId,
      taskId,
      contractorId,
      contractId,
      campaignId,
      amount,
      currency,
      paymentDate,
      method,
      comment,
      categoryId,
    } = req.body || {};

    if (!kind || !amount || !paymentDate) {
      return res.status(400).json({ error: 'kind, amount, paymentDate are required' });
    }

    const paymentId = `pay-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    let rows;
    try {
      const insertRes = await db.query(
        `INSERT INTO finance_payments (
          id, kind, invoice_id, project_id, task_id, contractor_id, contract_id,
          campaign_id, amount, currency, payment_date, method, comment, category_id, created_by
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
        RETURNING *`,
        [
          paymentId,
          kind,
          invoiceId || null,
          projectId || null,
          taskId || null,
          contractorId || null,
          contractId || null,
          campaignId || null,
          toNumber(amount),
          currency || 'RUB',
          parseDateValue(paymentDate),
          method || null,
          comment || null,
          categoryId || null,
          req.headers['x-user-id'] || null,
        ]
      );
      rows = insertRes.rows;
    } catch (err) {
      if (err && err.code === '23505' && String(err.constraint).includes('idx_finance_payments_unique')) {
        logger.warn('Duplicate payment detected, looking up existing payment.');
        const existingRes = await db.query(
          `SELECT * FROM finance_payments WHERE amount = $1 AND payment_date = $2 AND COALESCE(contractor_id,0) = COALESCE($3,0) AND kind = $4 LIMIT 1`,
          [toNumber(amount), parseDateValue(paymentDate), contractorId || null, kind]
        );
        if (existingRes.rows.length > 0) {
          rows = existingRes.rows;
        } else {
          throw err;
        }
      } else {
        throw err;
      }
    }

    if (invoiceId) {
      await recalculateInvoice(invoiceId).catch(e => logger.error('Recalculate invoice error:', e));
    }

    const statusCode = rows && rows[0] && rows[0].id === paymentId ? 201 : 200;
    res.status(statusCode).json(rows[0]);
  } catch (error) {
    logger.error('Error creating payment:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;