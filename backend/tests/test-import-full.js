/**
 * Комплексный тест импорта выписки
 * Проверяет:
 * 1. Защита от дублирования платежей
 * 2. Автоматическая привязка к счетам
 * 3. Пересчет статуса счета
 * 4. Добавление новых контрагентов
 */

const db = require('../db');
const axios = require('axios');

// Формат 1C TXT (Сбербанк/Альфа-Банк стиль)
function create1CContent(invoiceId, amount) {
  return `1CClientBankExchange
ВерсияФормата=2.0
Кодировка=Windows-1251
Отправитель=TestBank
Получатель=TestCompany
Создано=${new Date().toISOString()}
РасчСчет=40702810100000000001

СекцияДокумент=Распоряжение
Номер=1
Дата=15.01.2024
Сумма=${amount}
Плательщик=ООО "Тестовая Компания"
ПлательщикСчет=40702810100000000002
ПлательщикИНН=7701234567
ПлательщикБИК=044525225
Получатель=TestCompany LLC
ПолучательСчет=40702810100000000001
ПолучательИНН=7709876543
ПолучательБИК=044525225
НазначениеПлатежа=Оплата по счету ${invoiceId}
КонецДокумента

СекцияДокумент=Распоряжение
Номер=2
Дата=15.01.2024
Сумма=${amount}
Плательщик=ООО "Тестовая Компания"
ПлательщикСчет=40702810100000000002
ПлательщикИНН=7701234567
ПлательщикБИК=044525225
Получатель=TestCompany LLC
ПолучательСчет=40702810100000000001
ПолучательИНН=7709876543
ПолучательБИК=044525225
НазначениеПлатежа=Оплата по счету ${invoiceId} (ДУБЛЬ)
КонецДокумента
`;
}

(async () => {
  console.log('=== КОМПЛЕКСНЫЙ ТЕСТ ИМПОРТА ВЫПИСКИ ===\n');
  
  const invoiceAmount = 50000;
  const invoiceId = `test-inv-${Date.now()}`;
  
  // 1. Создаем тестовый счет
  console.log('1️⃣  Создание тестового счета...');
  await db.query(`
    INSERT INTO finance_invoices 
    (id, identifier, title, amount_total, amount_paid, amount_due, issue_date, due_date, status, currency)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'RUB')
  `, [invoiceId, `TEST-${Date.now()}`, 'Test Invoice', invoiceAmount, 0, invoiceAmount, '2024-01-01', '2024-02-01', 'sent']);
  console.log(`   ✅ Счет: ${invoiceId}, сумма: ${invoiceAmount}₽, статус: sent`);
  
  // 2. Проверяем что контрагента нет
  console.log('\n2️⃣  Проверка контрагента...');
  const { rows: beforeContractors } = await db.query(
    `SELECT id FROM contractors WHERE inn = '7701234567'`
  );
  console.log(`   Контрагент с ИНН 7701234567: ${beforeContractors.length > 0 ? 'найден' : 'не найден'}`);
  
  // 3. Импортируем выписку
  console.log('\n3️⃣  Импорт выписки (2 платежа: 1 реальный + 1 дубль)...');
  const csvContent = create1CContent(invoiceId, invoiceAmount);
  
  try {
    const response = await axios.post('http://localhost:5001/api/finance/statements/import', {
      content: csvContent,
      fileName: 'test-1c-exchange.txt',
      importType: '1c_txt',
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
    
    // 4. Проверяем контрагента
    console.log('\n4️⃣  Проверка контрагента после импорта...');
    const { rows: afterContractors } = await db.query(
      `SELECT id, name, inn FROM contractors WHERE inn = '7701234567'`
    );
    if (afterContractors.length > 0) {
      console.log(`   ✅ Контрагент создан: ${afterContractors[0].name} (ИНН: ${afterContractors[0].inn})`);
    } else {
      console.log('   ⚠️  Контрагент НЕ создан');
    }
    
    // 5. Проверяем статус счета
    console.log('\n5️⃣  Проверка статуса счета...');
    const { data: invoiceData } = await axios.get(`http://localhost:5001/api/finance/invoices/${invoiceId}`);
    console.log(`   Статус: ${invoiceData.status}`);
    console.log(`   Оплачено: ${invoiceData.amountPaid}₽ из ${invoiceData.amountTotal}₽`);
    console.log(`   Долг: ${invoiceData.amountDue}₽`);
    
    // 6. Проверяем платежи
    console.log('\n6️⃣  Проверка платежей...');
    const { rows: payments } = await db.query(
      `SELECT id, amount, payment_date, invoice_id as invoiceId FROM finance_payments WHERE invoice_id = $1`,
      [invoiceId]
    );
    console.log(`   Найдено платежей: ${payments.length}`);
    payments.forEach(p => {
      console.log(`   - ${p.id}: ${p.amount}₽ (${p.paymentDate})`);
    });
    
    // 7. Итоги
    console.log('\n=== ИТОГИ ===');
    const checks = {
      'Защита от дублирования': data.duplicatesSkipped === 1,
      'Создан 1 платеж': data.paymentsCreated === 1,
      'Автоматическая привязка': data.reconcileMatched >= 1,
      'Контрагент создан': afterContractors.length > 0,
      'Статус счета paid': invoiceData.status === 'paid',
      'Счет оплачен полностью': Number(invoiceData.amountPaid) >= invoiceAmount,
    };
    
    let passed = 0;
    for (const [check, result] of Object.entries(checks)) {
      const icon = result ? '✅' : '❌';
      console.log(`${icon} ${check}: ${result ? 'ДА' : 'НЕТ'}`);
      if (result) passed++;
    }
    
    console.log(`\n${passed}/${Object.keys(checks).length} проверок пройдено`);
    
    if (passed === Object.keys(checks).length) {
      console.log('\n🎉 ВСЁ РАБОТАЕТ ИДЕАЛЬНО!');
    }
    
  } catch (error) {
    console.log(`   ❌ Ошибка: ${error.response?.data?.error || error.message}`);
    if (error.response?.data) {
      console.log('   Details:', JSON.stringify(error.response.data, null, 2));
    }
  }
  
  // Очистка
  console.log('\n7️⃣  Очистка тестовых данных...');
  await db.query(`DELETE FROM finance_statement_lines WHERE statement_id LIKE 'stmt-%'`);
  await db.query(`DELETE FROM finance_bank_statements WHERE id LIKE 'stmt-%'`);
  await db.query(`DELETE FROM finance_payments WHERE invoice_id = $1`, [invoiceId]);
  await db.query(`DELETE FROM contractors WHERE inn = '7701234567'`);
  await db.query(`DELETE FROM finance_invoices WHERE id = $1`, [invoiceId]);
  console.log('   ✅ Очистка завершена');
  
  process.exit(0);
})();
