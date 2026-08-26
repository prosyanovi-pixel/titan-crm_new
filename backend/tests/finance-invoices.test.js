/**
 * Интеграционные тесты для модуля Finance - Invoices
 * Проверяют создание, обновление, привязку платежей и статусы счетов
 */

const db = require('../db');
const { recalculateInvoice } = require('../modules/finance/invoices/services');
const { buildInvoiceStatus } = require('../modules/finance/utils');

// Очистка тестовых данных
async function cleanup() {
  try {
    // Сначала удаляем строки выписок
    await db.query(`DELETE FROM finance_statement_lines WHERE id LIKE 'test-%'`);
    // Затем платежи
    await db.query(`DELETE FROM finance_payments WHERE id LIKE 'test-%'`);
    // В последнюю очередь счета
    await db.query(`DELETE FROM finance_invoices WHERE id LIKE 'test-%'`);
    await db.query(`DELETE FROM finance_bank_statements WHERE id LIKE 'test-%'`);
  } catch (e) {
    console.error('Cleanup error:', e.message);
  }
}

// Тест 1: Проверка buildInvoiceStatus
async function testBuildInvoiceStatus() {
  console.log('\n📋 Тест 1: Проверка buildInvoiceStatus');
  console.log('=' .repeat(60));
  
  const tests = [
    {
      name: 'Полностью оплаченный счет должен иметь статус paid',
      input: { currentStatus: 'sent', amountPaid: 1000, amountTotal: 1000, dueDate: '2024-01-01' },
      expected: 'paid'
    },
    {
      name: 'Оплаченный счет с прошедшей датой должен иметь статус paid',
      input: { currentStatus: 'sent', amountPaid: 1000, amountTotal: 1000, dueDate: '2020-01-01' },
      expected: 'paid'
    },
    {
      name: 'Частично оплаченный счет без просрочки',
      input: { currentStatus: 'sent', amountPaid: 500, amountTotal: 1000, dueDate: '2030-01-01' },
      expected: 'partial_paid'
    },
    {
      name: 'Частично оплаченный счет с просрочкой',
      input: { currentStatus: 'sent', amountPaid: 500, amountTotal: 1000, dueDate: '2020-01-01' },
      expected: 'overdue'
    },
    {
      name: 'Неоплаченный счет с прошедшей датой',
      input: { currentStatus: 'sent', amountPaid: 0, amountTotal: 1000, dueDate: '2020-01-01' },
      expected: 'overdue'
    },
    {
      name: 'Неоплаченный счет без просрочки',
      input: { currentStatus: 'sent', amountPaid: 0, amountTotal: 1000, dueDate: '2030-01-01' },
      expected: 'sent'
    },
    {
      name: 'Черновик остается черновиком',
      input: { currentStatus: 'draft', amountPaid: 0, amountTotal: 1000, dueDate: '2020-01-01' },
      expected: 'draft'
    }
  ];
  
  let passed = 0;
  let failed = 0;
  
  for (const test of tests) {
    const result = buildInvoiceStatus(test.input);
    const success = result === test.expected;
    
    if (success) {
      console.log(`✅ ${test.name}`);
      console.log(`   Результат: ${result}`);
      passed++;
    } else {
      console.log(`❌ ${test.name}`);
      console.log(`   Ожидалось: ${test.expected}, Получено: ${result}`);
      failed++;
    }
  }
  
  console.log(`\nИтого: ${passed} прошло, ${failed} провалилось`);
  return failed === 0;
}

// Тест 2: Создание и обновление счета с dueDate
async function testInvoiceDueDate() {
  console.log('\n📋 Тест 2: Проверка dueDate в счетах');
  console.log('=' .repeat(60));
  
  try {
    await cleanup(); // Очищаем перед тестом
    
    const testInvoiceId = `test-invoice-${Date.now()}`;
    const issueDate = '2024-01-01';
    const dueDate = '2024-02-01';
    
    // Создаем счет
    await db.query(`
      INSERT INTO finance_invoices 
      (id, identifier, title, amount_total, amount_paid, amount_due, issue_date, due_date, status, currency)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    `, [testInvoiceId, `TEST-${Date.now()}`, 'Test Invoice', 1000, 0, 1000, issueDate, dueDate, 'draft', 'RUB']);
    
    console.log(`✅ Счет создан: ${testInvoiceId}`);
    
    // Проверяем чтение
    const { rows: readRows } = await db.query(`SELECT * FROM finance_invoices WHERE id = $1`, [testInvoiceId]);
    const invoice = readRows[0];
    
    console.log('   Invoice keys:', Object.keys(invoice));
    console.log('   invoice.issueDate:', invoice.issueDate);
    console.log('   invoice.dueDate:', invoice.dueDate);
    
    // Функция для преобразования Date в строку YYYY-MM-DD (локальная дата)
    const toLocalDateString = (date) => {
      if (!date) return null;
      const d = new Date(date);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };
    
    const savedIssueDate = toLocalDateString(invoice.issueDate);
    const savedDueDate = toLocalDateString(invoice.dueDate);
    
    console.log(`   issueDate: ${savedIssueDate} (ожидалось: ${issueDate})`);
    console.log(`   dueDate: ${savedDueDate} (ожидалось: ${dueDate})`);
    
    if (savedDueDate !== dueDate) {
      console.log(`❌ dueDate не сохранился!`);
      return false;
    }
    console.log(`✅ dueDate сохранен корректно`);
    
    // Обновляем счет с новым dueDate
    const newDueDate = '2024-03-01';
    await db.query(`
      UPDATE finance_invoices SET due_date = $1, updated_at = now() WHERE id = $2
    `, [newDueDate, testInvoiceId]);
    
    const { rows: updatedRows } = await db.query(`SELECT * FROM finance_invoices WHERE id = $1`, [testInvoiceId]);
    const updated = updatedRows[0];
    
    console.log('   Updated invoice keys:', Object.keys(updated));
    console.log('   updated.dueDate:', updated.dueDate);
    
    const updatedDueDate = toLocalDateString(updated.dueDate);
    console.log(`   После обновления dueDate: ${updatedDueDate}`);
    
    if (updatedDueDate !== newDueDate) {
      console.log(`❌ dueDate не обновился!`);
      return false;
    }
    console.log(`✅ dueDate обновлен корректно`);
    
    // Очищаем
    await db.query(`DELETE FROM finance_invoices WHERE id = $1`, [testInvoiceId]);
    console.log(`✅ Тестовые данные очищены`);
    
    return true;
  } catch (error) {
    console.log(`❌ Ошибка: ${error.message}`);
    console.log(error.stack);
    return false;
  }
}

// Тест 3: Пересчет статуса при привязке платежа
async function testInvoiceRecalculation() {
  console.log('\n📋 Тест 3: Пересчет статуса при привязке платежа');
  console.log('=' .repeat(60));
  
  try {
    const testInvoiceId = `test-invoice-${Date.now()}`;
    const dueDate = '2024-02-01';
    
    // Создаем счет со статусом overdue
    await db.query(`
      INSERT INTO finance_invoices 
      (id, identifier, title, amount_total, amount_paid, amount_due, issue_date, due_date, status, currency)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    `, [testInvoiceId, 'TEST-002', 'Test Invoice', 1000, 0, 1000, '2024-01-01', dueDate, 'overdue', 'RUB']);
    
    console.log(`✅ Счет создан со статусом: overdue`);
    
    // Проверяем начальный статус
    const { rows: initialRows } = await db.query(`SELECT status FROM finance_invoices WHERE id = $1`, [testInvoiceId]);
    console.log(`   Начальный статус: ${initialRows[0].status}`);
    
    // Создаем платеж на полную сумму
    const paymentId = `test-payment-${Date.now()}`;
    const uniqueAmount = 1000 + Math.random();
    await db.query(`
      INSERT INTO finance_payments 
      (id, kind, invoice_id, amount, currency, payment_date, method)
      VALUES ($1, 'income', $2, $3, 'RUB', '2024-01-15', 'bank')
    `, [paymentId, testInvoiceId, uniqueAmount]);
    
    console.log(`✅ Платеж создан: ${paymentId} на сумму ${uniqueAmount}`);
    
    // Пересчитываем счет
    const result = await recalculateInvoice(testInvoiceId);
    
    console.log(`   После пересчета:`);
    console.log(`   - status: ${result.status}`);
    console.log(`   - amountPaid: ${result.amountPaid}`);
    console.log(`   - amountTotal: ${result.amountTotal}`);
    
    if (result.status !== 'paid') {
      console.log(`❌ Статус должен быть 'paid', но получен: ${result.status}`);
      await db.query(`DELETE FROM finance_invoices WHERE id = $1`, [testInvoiceId]);
      await db.query(`DELETE FROM finance_payments WHERE id = $1`, [paymentId]);
      return false;
    }
    console.log(`✅ Статус корректно изменен на 'paid'`);
    
    // Очищаем
    await db.query(`DELETE FROM finance_invoices WHERE id = $1`, [testInvoiceId]);
    await db.query(`DELETE FROM finance_payments WHERE id = $1`, [paymentId]);
    console.log(`✅ Тестовые данные очищены`);
    
    return true;
  } catch (error) {
    console.log(`❌ Ошибка: ${error.message}`);
    console.log(error.stack);
    return false;
  }
}

// Тест 4: Проверка API валидации (camelCase vs snake_case)
async function testValidatorCompatibility() {
  console.log('\n📋 Тест 4: Валидация camelCase и snake_case');
  console.log('=' .repeat(60));
  
  const { validateInvoiceData } = require('../modules/finance/invoices/validators');
  
  const tests = [
    {
      name: 'snake_case due_date',
      input: { title: 'Test', amount_total: 1000, issue_date: '2024-01-01', due_date: '2024-02-01' },
      shouldPass: true
    },
    {
      name: 'camelCase dueDate',
      input: { title: 'Test', amount_total: 1000, issue_date: '2024-01-01', dueDate: '2024-02-01' },
      shouldPass: true
    },
    {
      name: 'snake_case issue_date',
      input: { title: 'Test', amount_total: 1000, issue_date: '2024-01-01', due_date: '2024-02-01' },
      shouldPass: true
    },
    {
      name: 'camelCase issueDate',
      input: { title: 'Test', amount_total: 1000, issueDate: '2024-01-01', due_date: '2024-02-01' },
      shouldPass: true
    },
    {
      name: 'Оба формата camelCase',
      input: { title: 'Test', amountTotal: 1000, issueDate: '2024-01-01', dueDate: '2024-02-01' },
      shouldPass: true
    }
  ];
  
  let passed = 0;
  let failed = 0;
  
  for (const test of tests) {
    const result = validateInvoiceData(test.input);
    const success = result.valid === test.shouldPass;
    
    if (success) {
      console.log(`✅ ${test.name}`);
      if (!result.valid) {
        console.log(`   Ошибки: ${result.errors.join(', ')}`);
      }
      passed++;
    } else {
      console.log(`❌ ${test.name}`);
      console.log(`   Ожидалось: ${test.shouldPass ? 'валидно' : 'не валидно'}, Получено: ${result.valid ? 'валидно' : 'не валидно'}`);
      if (!result.valid) {
        console.log(`   Ошибки: ${result.errors.join(', ')}`);
      }
      failed++;
    }
  }
  
  console.log(`\nИтого: ${passed} прошло, ${failed} провалилось`);
  return failed === 0;
}

// Тест 5: Привязка платежа к счету через statement line
async function testStatementLineAttachment() {
  console.log('\n📋 Тест 5: Привязка платежа через statement line');
  console.log('=' .repeat(60));
  
  try {
    await cleanup(); // Очищаем перед тестом
    
    const { assignLine } = require('../modules/finance/services/statementReconciliation');
    
    const testInvoiceId = `test-invoice-${Date.now()}`;
    const testStatementId = `test-statement-${Date.now()}`;
    const testLineId = `test-line-${Date.now()}`;
    
    // Создаем счет
    await db.query(`
      INSERT INTO finance_invoices 
      (id, identifier, title, amount_total, amount_paid, amount_due, issue_date, due_date, status, currency)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    `, [testInvoiceId, `TEST-INV-${Date.now()}`, 'Test Invoice', 5000, 0, 5000, '2024-01-01', '2024-02-01', 'sent', 'RUB']);
    
    console.log(`✅ Счет создан: ${testInvoiceId}`);
    
    // Создаем выписку
    await db.query(`
      INSERT INTO finance_bank_statements 
      (id, import_type, total_credit, total_debit, status)
      VALUES ($1, 'csv', 5000, 0, 'pending')
    `, [testStatementId]);
    
    // Создаем строку выписки
    const uniqueStatementAmount = 5000 + Math.random();
    await db.query(`
      INSERT INTO finance_statement_lines 
      (id, statement_id, line_date, amount, direction, counterparty, purpose)
      VALUES ($1, $2, '2024-01-15', $3, 'credit', 'Test Client', 'Payment for invoice')
    `, [testLineId, testStatementId, uniqueStatementAmount]);
    
    console.log(`✅ Строка выписки создана: ${testLineId}`);
    
    // Привязываем счет к строке выписки
    const userId = 'test-user';
    const result = await assignLine(testLineId, { invoiceId: testInvoiceId, paymentId: null, categoryId: null }, userId);
    
    console.log(`✅ Счет привязан к строке выписки`);
    console.log(`   invoiceId: ${result.invoiceId}`);
    console.log(`   paymentId: ${result.paymentId}`);
    
    // Проверяем, что платеж создан
    const { rows: paymentRows } = await db.query(
      `SELECT * FROM finance_payments WHERE invoice_id = $1`, 
      [testInvoiceId]
    );
    
    if (paymentRows.length === 0) {
      console.log(`❌ Платеж не создан!`);
      await cleanup();
      return false;
    }
    
    console.log(`✅ Платеж создан: ${paymentRows[0].id}`);
    console.log(`   Сумма: ${paymentRows[0].amount}`);
    
    // Проверяем статус счета после привязки
    const { rows: invoiceRows } = await db.query(
      `SELECT status, amount_paid, amount_total FROM finance_invoices WHERE id = $1`, 
      [testInvoiceId]
    );
    
    if (invoiceRows.length === 0) {
      console.log(`❌ Счет не найден!`);
      await cleanup();
      return false;
    }
    
    const invoice = invoiceRows[0];
    console.log(`   Статус счета: ${invoice.status}`);
    console.log(`   amount_paid: ${invoice.amountPaid || invoice.amount_paid}`);
    console.log(`   amount_total: ${invoice.amountTotal || invoice.amount_total}`);
    
    if (invoice.status !== 'paid') {
      console.log(`❌ Статус должен быть 'paid', но получен: ${invoice.status}`);
      await cleanup();
      return false;
    }
    
    console.log(`✅ Статус корректно изменен на 'paid'`);
    
    // Очищаем
    await cleanup();
    console.log(`✅ Тестовые данные очищены`);
    
    return true;
  } catch (error) {
    console.log(`❌ Ошибка: ${error.message}`);
    console.log(error.stack);
    await cleanup();
    return false;
  }
}

// Запуск всех тестов
async function runAllTests() {
  console.log('\n' + '=' .repeat(60));
  console.log('🧪 ИНТЕГРАЦИОННЫЕ ТЕСТЫ FINANCE MODULE');
  console.log('=' .repeat(60));
  
  const results = [];
  
  results.push(await testBuildInvoiceStatus());
  results.push(await testInvoiceDueDate());
  results.push(await testInvoiceRecalculation());
  results.push(await testValidatorCompatibility());
  results.push(await testStatementLineAttachment());
  
  console.log('\n' + '=' .repeat(60));
  const passed = results.filter(r => r).length;
  const total = results.length;
  
  if (passed === total) {
    console.log(`✅ ВСЕ ТЕСТЫ ПРОЙДЕНЫ: ${passed}/${total}`);
  } else {
    console.log(`❌ ТЕСТЫ ПРОВАЛЕНЫ: ${passed}/${total}`);
  }
  console.log('=' .repeat(60) + '\n');
  
  process.exit(passed === total ? 0 : 1);
}

// Проверяем, не запущен ли скрипт через Playwright (e2e тесты)
if (process.env.PLAYWRIGHT === 'true' || process.env.npm_lifecycle_event === 'test:e2e') {
  console.log('⏩ Интеграционные тесты finance module пропущены (запущен Playwright)');
  process.exit(0);
}

// Запуск
runAllTests().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
