/**
 * Тестовый скрипт для проверки API Finance Module
 * Проверяет привязку счетов, обновление статусов и т.д.
 * 
 * Использование:
 *   node test-finance-api.js
 */

const axios = require('axios');

const API_BASE = 'http://localhost:5001/api/finance';

// Цвета для вывода
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testGetInvoices() {
  log('\n📋 Тест 1: Получение списка счетов', 'blue');
  try {
    const response = await axios.get(`${API_BASE}/invoices`);
    log(`✅ Получено счетов: ${response.data.length}`, 'green');
    response.data.slice(0, 3).forEach(inv => {
      console.log(`   - ${inv.identifier}: ${inv.status} (${inv.amountPaid}/${inv.amountTotal})`);
    });
    return response.data;
  } catch (error) {
    log(`❌ Ошибка: ${error.response?.data?.error || error.message}`, 'red');
    return [];
  }
}

async function testGetInvoiceById(invoiceId) {
  log(`\n📋 Тест 2: Получение счета ${invoiceId}`, 'blue');
  try {
    const response = await axios.get(`${API_BASE}/invoices/${invoiceId}`);
    const inv = response.data;
    log(`✅ Счет: ${inv.identifier}`, 'green');
    console.log(`   Статус: ${inv.status}`);
    console.log(`   Сумма: ${inv.amountTotal}`);
    console.log(`   Оплачено: ${inv.amountPaid}`);
    console.log(`   Долг: ${inv.amountDue}`);
    console.log(`   Срок оплаты: ${inv.dueDate}`);
    return inv;
  } catch (error) {
    log(`❌ Ошибка: ${error.response?.data?.error || error.message}`, 'red');
    return null;
  }
}

async function testUpdateInvoice(invoiceId, updates) {
  log(`\n📋 Тест 3: Обновление счета ${invoiceId}`, 'blue');
  console.log('   Данные:', JSON.stringify(updates));
  try {
    // Для обновления нужно передать все обязательные поля
    const fullUpdates = {
      ...updates,
      amount_total: updates.amount_total || 1000,
      issue_date: updates.issue_date || '2024-01-01'
    };
    const response = await axios.put(`${API_BASE}/invoices/${invoiceId}`, fullUpdates);
    log(`✅ Счет обновлен`, 'green');
    console.log(`   Новый статус: ${response.data.status}`);
    return response.data;
  } catch (error) {
    log(`❌ Ошибка: ${error.response?.data?.error || error.message}`, 'red');
    return null;
  }
}

async function testGetPayments(invoiceId) {
  log(`\n📋 Тест 4: Получение платежей для счета ${invoiceId}`, 'blue');
  try {
    const response = await axios.get(`${API_BASE}/payments`, {
      params: { invoiceId }
    });
    log(`✅ Получено платежей: ${response.data.length}`, 'green');
    response.data.forEach(pay => {
      console.log(`   - ${pay.id}: ${pay.amount} (${pay.paymentDate})`);
    });
    return response.data;
  } catch (error) {
    log(`❌ Ошибка: ${error.response?.data?.error || error.message}`, 'red');
    return [];
  }
}

async function testCreatePayment(invoiceId, amount) {
  log(`\n📋 Тест 5: Создание платежа для счета ${invoiceId}`, 'blue');
  const paymentData = {
    kind: 'income',
    invoiceId: invoiceId,
    amount: amount,
    currency: 'RUB',
    paymentDate: new Date().toISOString().split('T')[0],
    method: 'bank',
    comment: 'Тестовый платеж'
  };
  console.log('   Данные:', JSON.stringify(paymentData));
  try {
    const response = await axios.post(`${API_BASE}/payments`, paymentData);
    log(`✅ Платеж создан: ${response.data.id}`, 'green');
    return response.data;
  } catch (error) {
    log(`❌ Ошибка: ${error.response?.data?.error || error.message}`, 'red');
    return null;
  }
}

async function testUpdatePayment(paymentId, updates) {
  log(`\n📋 Тест 6: Обновление платежа ${paymentId}`, 'blue');
  console.log('   Данные:', JSON.stringify(updates));
  try {
    const response = await axios.put(`${API_BASE}/payments/${paymentId}`, updates);
    log(`✅ Платеж обновлен`, 'green');
    console.log(`   invoice_id: ${response.data.invoiceId || response.data.invoice_id}`);
    return response.data;
  } catch (error) {
    log(`❌ Ошибка: ${error.response?.data?.error || error.message}`, 'red');
    return null;
  }
}

async function testGetStatements() {
  log('\n📋 Тест 7: Получение выписок', 'blue');
  try {
    const response = await axios.get(`${API_BASE}/statements`);
    log(`✅ Получено выписок: ${response.data.length}`, 'green');
    return response.data;
  } catch (error) {
    log(`❌ Ошибка: ${error.response?.data?.error || error.message}`, 'red');
    return [];
  }
}

async function testUpdateStatementLine(lineId, invoiceId) {
  log(`\n📋 Тест 8: Привязка счета ${invoiceId} к строке выписки ${lineId}`, 'blue');
  try {
    const response = await axios.put(`${API_BASE}/statements/lines/${lineId}`, {
      invoiceId: invoiceId
    });
    log(`✅ Счет привязан`, 'green');
    console.log(`   invoice_id: ${response.data.invoiceId || response.data.invoice_id}`);
    console.log(`   payment_id: ${response.data.paymentId || response.data.payment_id}`);
    return response.data;
  } catch (error) {
    log(`❌ Ошибка: ${error.response?.data?.error || error.message}`, 'red');
    return null;
  }
}

async function runAllTests() {
  log('\n' + '='.repeat(60), 'blue');
  log('🧪 ТЕСТИРОВАНИЕ FINANCE MODULE API', 'blue');
  log('='.repeat(60), 'blue');
  
  // Проверяем доступность API
  try {
    await axios.get(`${API_BASE}/invoices`);
    log('✅ API доступно', 'green');
  } catch (error) {
    log('❌ API недоступно. Убедитесь, что сервер запущен на порту 5001', 'red');
    process.exit(1);
  }
  
  // Тест 1: Получаем список счетов
  const invoices = await testGetInvoices();
  if (invoices.length === 0) {
    log('\n⚠️  Нет счетов для тестирования', 'yellow');
    return;
  }
  
  // Тест 2: Получаем первый счет
  const invoice = await testGetInvoiceById(invoices[0].id);
  if (!invoice) return;
  
  // Тест 3: Обновляем счет (dueDate)
  const newDueDate = new Date();
  newDueDate.setDate(newDueDate.getDate() + 30);
  await testUpdateInvoice(invoice.id, {
    dueDate: newDueDate.toISOString().split('T')[0]
  });
  
  // Тест 4: Получаем платежи
  await testGetPayments(invoice.id);
  
  // Тест 5: Создаем тестовый платеж (если счет не оплачен)
  let payment = null;
  if (Number(invoice.amountPaid) < Number(invoice.amountTotal)) {
    payment = await testCreatePayment(invoice.id, Number(invoice.amountTotal));
  }
  
  // Тест 6: Обновляем платеж (если создан)
  if (payment) {
    await testUpdatePayment(payment.id, {
      comment: 'Обновленный тестовый платеж'
    });
  }
  
  // Тест 7: Получаем выписки
  const statements = await testGetStatements();
  
  // Тест 8: Привязываем счет к строке выписки (если есть выписки)
  if (statements.length > 0 && statements[0].lines && statements[0].lines.length > 0) {
    const line = statements[0].lines[0];
    await testUpdateStatementLine(line.id, invoice.id);
  }
  
  log('\n' + '='.repeat(60), 'blue');
  log('✅ ТЕСТИРОВАНИЕ ЗАВЕРШЕНО', 'green');
  log('='.repeat(60) + '\n', 'blue');
}

// Запуск
runAllTests().catch(err => {
  log(`\n❌ Критическая ошибка: ${err.message}`, 'red');
  process.exit(1);
});
