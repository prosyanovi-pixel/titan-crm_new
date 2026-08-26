/**
 * Роуты для платёжного календаря
 * GET /finance/calendar-payments
 * Роут для отображения предстоящих платежей по счетам в календаре
 */

const express = require('express');
const router = express.Router();
const db = require('../../db');
const logger = require('../../utils/logger');
const { toNumber, parseDateValue } = require('./utils');

// GET /calendar-payments - платежи на календарь
router.get('/', async (req, res) => {
  try {
    // Frontend отправляет ?period=week|month
    const period = req.query.period === 'week' ? 'week' : 'month';

    const startDate = new Date();
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + (period === 'month' ? 30 : 7));

    const { rows } = await db.query(
      `SELECT
         fi.id,
         fi.identifier,
         fi.invoice_type,
         fi.amount_due,
         fi.currency,
         fi.due_date,
         ce.date AS calendar_date,
         c.name AS contractor_name,
         p.name AS project_name
       FROM finance_invoices fi
       LEFT JOIN calendar_events ce ON ce.id = fi.calendar_event_id
       LEFT JOIN contractors c ON c.id = fi.contractor_id
       LEFT JOIN projects p ON p.id = fi.project_id
       WHERE fi.status <> 'paid'
         AND fi.due_date >= $1
         AND fi.due_date <= $2
       ORDER BY fi.due_date ASC`,
      [
        startDate.toISOString().split('T')[0],
        endDate.toISOString().split('T')[0],
      ]
    );

    // Маппинг в CalendarPayment (соответствует типу фронтенда)
    // db.js автоматически конвертирует snake_case → camelCase
    const payload = rows.map((row) => {
      const paymentDate = parseDateValue(row.calendarDate) || parseDateValue(row.dueDate);

      const contractor = row.contractorName || 'Без контрагента';
      const project = row.projectName || 'Без проекта';
      const description = `Счёт ${row.identifier} — ${contractor}${project !== 'Без проекта' ? ` / ${project}` : ''}`;

      // outgoing (мы выставляем) → income, incoming (нам выставляют) → expense
      const kind = row.invoiceType === 'outgoing' ? 'income' : 'expense';

      const dueDateStr = parseDateValue(row.dueDate);
      const isUpcoming = dueDateStr ? new Date(dueDateStr).getTime() >= startDate.getTime() : false;

      return {
        id: row.id,
        kind,
        amount: toNumber(row.amountDue),
        paymentDate,
        description,
        isUpcoming,
      };
    });

    res.json(payload);
  } catch (error) {
    logger.error('calendar-payments GET error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
