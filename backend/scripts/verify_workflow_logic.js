const db = require('../db');
const { upsertContractor } = require('../modules/finance/statementHelpers');
const paymentProcessor = require('../modules/finance/services/statementParts/paymentProcessor');

async function verify() {
  console.log('--- STARTING WORKFLOW LOGIC VERIFICATION ---');

  const testLine = {
    date: '2026-06-02',
    amount: 12500.50,
    direction: 'credit',
    counterparty: 'ООО "Альфа-Тест"',
    counterpartyInn: '7700000001',
    counterpartyAccount: '40702810000000000001',
    counterpartyBankName: 'Альфа-Банк',
    counterpartyBik: '044525593',
    purpose: 'Оплата за услуги по счёту № TEST-123',
    reference: '123'
  };

  const userId = 'system-test';
  const stmtId = 'test-stmt-' + Date.now();

  try {
    // 1. First run: should create contractor, bank account and payment
    console.log('\n[Run 1] Processing statement line...');
    const result1 = await upsertContractor(testLine);
    console.log('Contractor result:', {
      id: result1.contractorId,
      isNew: result1.isNew,
      newAccountAdded: result1.newAccountAdded
    });

    const payResult1 = await paymentProcessor.processPayment(testLine, result1.contractorId, 'test-line-1', userId);
    console.log('Payment result:', {
      id: payResult1.paymentId,
      created: payResult1.created,
      duplicate: payResult1.duplicate
    });

    // 2. Second run: should recognize existing data
    console.log('\n[Run 2] Processing SAME statement line again...');
    const result2 = await upsertContractor(testLine);
    console.log('Contractor result:', {
      id: result2.contractorId,
      isNew: result2.isNew,
      accountExists: result2.accountExists,
      newAccountAdded: result2.newAccountAdded
    });

    const payResult2 = await paymentProcessor.processPayment(testLine, result2.contractorId, 'test-line-2', userId);
    console.log('Payment result:', {
      id: payResult2.paymentId,
      created: payResult2.created,
      duplicate: payResult2.duplicate
    });

    if (payResult2.duplicate === true && payResult1.paymentId === payResult2.paymentId) {
      console.log('\n✅ SUCCESS: Duplicate payment detected and skipped correctly.');
    } else {
      console.error('\n❌ FAILURE: Duplicate payment handling failed!');
    }

    if (result2.accountExists === true && result2.newAccountAdded === false) {
      console.log('✅ SUCCESS: Existing bank account recognized correctly.');
    } else {
      console.error('❌ FAILURE: Bank account handling failed!');
    }

    // Cleanup test data
    console.log('\nCleaning up test data...');
    await db.query('DELETE FROM finance_payments WHERE id = $1', [payResult1.paymentId]);
    await db.query('DELETE FROM contractor_bank_accounts WHERE account_number = $1', [testLine.counterpartyAccount]);
    await db.query('DELETE FROM contractors WHERE id = $1', [result1.contractorId]);
    console.log('Cleanup done.');

  } catch (err) {
    console.error('ERROR DURING VERIFICATION:', err);
  } finally {
    process.exit(0);
  }
}

verify();