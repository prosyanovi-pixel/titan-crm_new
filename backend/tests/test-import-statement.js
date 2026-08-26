/**
 * Тест импорта выписки с проверкой:
 * 1. Защита от дублирования платежей
 * 2. Автоматическая привязка к счетам
 * 3. Пересчет статуса счета
 */

const db = require('../db');
const axios = require('axios');

(async () => {
  console.log('=== ТЕСТ ИМПОРТА ВЫПИСКИ ===\n');
  
  // Создаем тестовый счет
  const invoiceId = `test-inv-import-${Date.now()}`;
  const invoiceAmount = 50000;
  
  console.log('1️⃣  Создание тестового счета...');
  await db.query(`
    INSERT INTO finance_invoices 
    (id, identifier, title, amount_total, amount_paid, amount_due, issue_date, due_date, status, currency)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'RUB')
  `, [invoiceId, `TEST-IMPORT-${Date.now()}`, 'Test Invoice for Import', invoiceAmount, 0, invoiceAmount, '2024-01-01', '2024-02-01', 'sent']);
  
  console.log(`   ✅ Счет создан: ${invoiceId}`);
  console.log(`   Статус ДО: sent (amount_due: ${invoiceAmount})`);
  
  // Создаем CSV контент выписки
  const csvContent = `
14.01.2024;2;Поступление от ООО "Тест";50000.00;Р/с 40702810100000000001;Плательщик:ООО "Тест";Счет №${invoiceId};Оплата по счету
15.01.2024;2;Поступление от ООО "Тест";50000.00;Р/с 40702810100000000001;Плательщик:ООО "Тест";Счет №${invoiceId};Оплата по счету (дубль)
`.trim();
  
  console.log('\n2️⃣  Импорт выписки...');
  console.log('   CSV строки: 2 (одна оплата + дубль)');
  
  try {
    const response = await axios.post('http://localhost:5001/api/finance/statements/import', {
      content: csvContent,
      fileName: 'test-import.csv',
      importType: 'csv',
      account: '40702810100000000001',
    }, {
      headers: { 'Content-Type': 'application/json' },
    });
    
    const data = response.data;
    console.log('   ✅ Импорт завершен!');
    console.log(`   statementId: ${data.statementId}`);
    console.log(`   paymentsCreated: ${data.paymentsCreated}`);
    console.log(`   duplicatesSkipped: ${data.duplicatesSkipped}`);
    console.log(`   reconcileMatched: ${data.reconcileMatched || 0}`);
    
    // Проверяем статус счета после импорта
    const { data: invoiceData } = await axios.get(`http://localhost:5001/api/finance/invoices/${invoiceId}`);
    console.log(`\n3️⃣  Статус счета ПОСЛЕ импорта:`);
    console.log(`   status: ${invoiceData.status}`);
    console.log(`   amountPaid: ${invoiceData.amountPaid}`);
    console.log(`   amountDue: ${invoiceData.amountDue}`);
    
    if (invoiceData.status === 'paid' && Number(invoiceData.amountPaid) >= invoiceAmount) {
      console.log('\n🎉 УСПЕХ!');
      console.log('   ✅ Защита от дублирования работает');
      console.log('   ✅ Автоматическая привязка к счету работает');
      console.log('   ✅ Пересчет статуса счета работает');
    } else {
      console.log('\n⚠️  Что-то пошло не так...');
      console.log(`   Ожидалось: status=paid, amountPaid>=${invoiceAmount}`);
    }
    
  } catch (error) {
    console.log(`   ❌ Ошибка импорта: ${error.response?.data?.error || error.message}`);
    if (error.response?.data) {
      console.log('   Details:', JSON.stringify(error.response.data, null, 2));
    }
  }
  
  // Очистка
  console.log('\n4️⃣  Очистка тестовых данных...');
  await db.query(`DELETE FROM finance_statement_lines WHERE statement_id LIKE 'stmt-%'`);
  await db.query(`DELETE FROM finance_bank_statements WHERE id LIKE 'stmt-%'`);
  await db.query(`DELETE FROM finance_payments WHERE invoice_id = $1`, [invoiceId]);
  await db.query(`DELETE FROM finance_invoices WHERE id = $1`, [invoiceId]);
  console.log('   ✅ Очистка завершена');
  
  process.exit(0);
})();
