/**
 * Integration tests for Finance and TAX module
 */

const test = require('node:test');
const assert = require('node:assert');
const db = require('../db');
const { validateInvoiceData } = require('../modules/finance/invoices/validators');

test('Finance & TAX Logic', async (t) => {
  let testContractorId;
  let testInvoiceId;

  // Setup
  const contractorRes = await db.query(
    "INSERT INTO contractors (name, legal_form, inn) VALUES ($1, $2, $3) RETURNING id",
    ['Test TAX Contractor', 'OOO', '1234567890']
  );
  testContractorId = contractorRes.rows[0].id;

  await t.test('Validator should handle VAT fields', () => {
    const data = {
      title: 'Test VAT',
      amount_total: 1000,
      issue_date: '2026-01-01',
      due_date: '2026-02-01',
      vatRate: 22,
      vatAmount: 220,
      isTaxable: true
    };
    const result = validateInvoiceData(data);
    assert.strictEqual(result.valid, true);
    assert.strictEqual(result.data.vat_rate, 22);
    assert.strictEqual(result.data.vat_amount, 220);
    assert.strictEqual(result.data.is_taxable, true);
  });

  await t.test('DDS grouping with NULL categories', async () => {
    // Create a payment without category with unique amount to avoid constraint violation
    const payId = `test-pay-${Date.now()}`;
    const uniqueAmount = 500 + Math.floor(Math.random() * 1000000) / 100;
    const uniqueDate = new Date().toISOString().split('T')[0];

    await db.query(
      "INSERT INTO finance_payments (id, kind, amount, payment_date, contractor_id) VALUES ($1, $2, $3, $4, $5)",
      [payId, 'income', uniqueAmount, uniqueDate, testContractorId]
    );

    // Query like the reports/dds endpoint
    const { rows } = await db.query(
      `SELECT
         fp.kind,
         COALESCE(fc.name, CASE WHEN fp.kind = 'income' THEN 'Прочие поступления' ELSE 'Прочие расходы' END) AS category_name,
         SUM(fp.amount) AS total
       FROM finance_payments fp
       LEFT JOIN finance_expense_categories fc ON fc.id = fp.category_id
       WHERE fp.id = $1
       GROUP BY fp.kind, fp.category_id, fc.name`,
      [payId]
    );

    assert.strictEqual(rows.length, 1);
    // db.query returns camelCase
    assert.strictEqual(rows[0].categoryName, 'Прочие поступления');
    assert.strictEqual(Number(rows[0].total), uniqueAmount);

    // Cleanup
    await db.query("DELETE FROM finance_payments WHERE id = $1", [payId]);
  });

  // Cleanup
  if (testContractorId) await db.query("DELETE FROM contractors WHERE id = $1", [testContractorId]);
});
