const express = require('express');

const db = require('../../../../db');

const router = express.Router();

function parseDateValue(val) {
  if (!val) return null;
  const d = new Date(val);
  return isNaN(d.getTime()) ? null : d.toISOString().split('T')[0];
}

router.get('/register', async (req, res) => {
  try {
    const { dateFrom, dateTo, kind, projectId, contractorId } = req.query;
    const conds = [];
    const params = [];
    if (kind) { params.push(kind); conds.push(`fp.kind = $${params.length}`); }
    if (projectId) { params.push(projectId); conds.push(`fp.project_id = $${params.length}`); }
    if (contractorId) { params.push(contractorId); conds.push(`fp.contractor_id = $${params.length}`); }
    if (dateFrom) { params.push(parseDateValue(dateFrom)); conds.push(`fp.payment_date >= $${params.length}`); }
    if (dateTo) { params.push(parseDateValue(dateTo)); conds.push(`fp.payment_date <= $${params.length}`); }
    const where = conds.length ? `WHERE ${conds.join(' AND ')}` : '';

    const { rows } = await db.query(
      `SELECT
         fp.id,
         fp.kind,
         fp.amount,
         fp.currency,
         fp.payment_date,
         fp.method,
         fp.comment,
         fp.category_id,
         fc.name AS category_name,
         fi.identifier AS invoice_identifier,
         p.name  AS project_name,
         c.name  AS contractor_name
       FROM finance_payments fp
       LEFT JOIN finance_expense_categories fc ON fc.id = fp.category_id
       LEFT JOIN finance_invoices fi ON fi.id = fp.invoice_id
       LEFT JOIN projects p ON p.id = fp.project_id
       LEFT JOIN contractors c ON c.id = fp.contractor_id
       ${where}
       ORDER BY fp.payment_date DESC`,
      params
    );

    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;