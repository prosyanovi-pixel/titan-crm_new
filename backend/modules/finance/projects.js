/**
 * Роуты для финансовой сводки по проектам
 */

const express = require('express');
const router = express.Router();
const db = require('../../db');
const { toNumber } = require('./utils');

// GET /projects - список проектов с финансовой сводкой
router.get('/', async (req, res) => {
  try {
    const { rows } = await db.query('SELECT id, name, budget FROM projects ORDER BY id');
    
    const projects = [];
    for (const project of rows) {
      const invoiceAgg = await db.query(
        `SELECT COALESCE(SUM(amount_total), 0) AS total_invoiced, COALESCE(SUM(amount_paid), 0) AS total_paid FROM finance_invoices WHERE project_id = $1`,
        [project.id]
      );
      const expenseAgg = await db.query(
        `SELECT COALESCE(SUM(amount), 0) AS total_expenses FROM finance_payments WHERE project_id = $1 AND kind = 'expense'`,
        [project.id]
      );
      
      projects.push({
        id: project.id,
        name: project.name,
        budget: project.budget,
        totalInvoiced: toNumber(invoiceAgg.rows[0].total_invoiced),
        totalPaid: toNumber(invoiceAgg.rows[0].total_paid),
        totalExpenses: toNumber(expenseAgg.rows[0].total_expenses),
      });
    }
    
    res.json(projects);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /projects/:projectId/summary - финансовая сводка по проекту
router.get('/:projectId/summary', async (req, res) => {
  try {
    const { projectId } = req.params;

    const invoiceAgg = await db.query(
      `SELECT
         COALESCE(SUM(amount_total), 0) AS total_invoiced,
         COALESCE(SUM(amount_paid), 0) AS total_paid,
         COALESCE(SUM(amount_due), 0) AS open_receivables
       FROM finance_invoices
       WHERE project_id = $1`,
      [projectId]
    );

    const expenseAgg = await db.query(
      `SELECT COALESCE(SUM(amount), 0) AS total_expenses
       FROM finance_payments
       WHERE project_id = $1 AND kind = 'expense'`,
      [projectId]
    );

    const directIncomeAgg = await db.query(
      `SELECT COALESCE(SUM(amount), 0) AS direct_income
       FROM finance_payments
       WHERE project_id = $1 AND kind = 'income' AND invoice_id IS NULL`,
      [projectId]
    );

    const totalInvoiced = toNumber(invoiceAgg.rows[0].totalInvoiced);
    const totalPaid = toNumber(invoiceAgg.rows[0].totalPaid) + toNumber(directIncomeAgg.rows[0].directIncome);
    const totalExpenses = toNumber(expenseAgg.rows[0].totalExpenses);
    const openReceivables = toNumber(invoiceAgg.rows[0].openReceivables);
    const profitLoss = totalPaid - totalExpenses;

    res.json({
      projectId: Number(projectId),
      totalInvoiced,
      totalPaid,
      totalExpenses,
      openReceivables,
      profitLoss,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
