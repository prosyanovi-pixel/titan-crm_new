/**
 * Сервис синхронизации счетов Finance с доходами Проектов
 * Автоматически создаёт project_revenues при создании finance_invoices
 */

const db = require('../../../db');

/**
 * Парсинг даты из dd.MM.yyyy
 */
function parseDate(dateStr) {
  if (!dateStr) return null;
  if (dateStr.includes('.')) {
    const [day, month, year] = dateStr.split('.');
    return new Date(year, month - 1, day);
  }
  return new Date(dateStr);
}

/**
 * Форматирование даты в dd.MM.yyyy
 */
function formatDate(date) {
  if (!date) return null;
  const d = new Date(date);
  if (isNaN(d.getTime())) return null;
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}.${month}.${year}`;
}

/**
 * Создать доход проекта при создании счёта Finance
 * Вызывается после создания finance_invoices
 */
async function syncInvoiceToRevenue(invoiceData) {
  const { 
    id: invoiceId, 
    project_id, 
    projectId, 
    amount_total, 
    amountTotal,
    issue_date, 
    due_date, 
    title 
  } = invoiceData;

  // db.js конвертирует snake_case → camelCase
  const finalProjectId = projectId || project_id;
  const finalAmount = amountTotal || amount_total;

  if (!finalProjectId) {
    console.log(`⚠️  Счёт ${invoiceId} не привязан к проекту`);
    return null; // Счёт не привязан к проекту
  }

  try {
    console.log(`🔄 Синхронизация счёта ${invoiceId} (проект ${finalProjectId}, сумма ${finalAmount})...`);

    // Проверяем существует ли уже связанный доход
    const existingRes = await db.query(
      'SELECT id FROM project_revenues WHERE invoice_id = $1',
      [invoiceId]
    );

    if (existingRes.rows.length > 0) {
      console.log(`✅ Уже существует: ${existingRes.rows[0].id}`);
      return existingRes.rows[0]; // Уже существует
    }

    // Получаем следующий ID для project_revenues
    const idRes = await db.query('SELECT COALESCE(MAX(id), 0) + 1 as "nextId" FROM project_revenues');
    const nextId = idRes.rows[0].nextid || idRes.rows[0].nextId;
    console.log(`📝 Следующий ID: ${nextId}`);

    // Создаём доход проекта
    const query = `
      INSERT INTO project_revenues (
        id, project_id, name, description, amount, currency,
        planned_date, invoice_id, status, is_taxable
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `;

    const values = [
      nextId,
      finalProjectId,
      title || `Счёт ${invoiceId}`,
      `Автоматически создано из finance_invoices ${invoiceId}`,
      finalAmount,
      'RUB',
      parseDate(due_date || issue_date),
      invoiceId,
      'invoiced', // Статус: счёт выставлен
      true,
    ];

    console.log(`📝 Values: ${values}`);

    const { rows } = await db.query(query, values);
    console.log(`✅ Синхронизация: Счёт ${invoiceId} → Доход проекта ${rows[0].id}`);
    return rows[0];
  } catch (error) {
    console.error('❌ Ошибка синхронизации счёта с доходом:', error.message);
    console.error('Stack:', error.stack);
    return null;
  }
}

/**
 * Обновить доход проекта при оплате счёта
 * Вызывается при обновлении finance_invoices.amount_paid
 */
async function syncInvoicePaymentToRevenue(invoiceId, amountPaid, status) {
  if (!invoiceId) return null;

  try {
    // Находим связанный доход проекта
    const revenueRes = await db.query(
      'SELECT id FROM project_revenues WHERE invoice_id = $1',
      [invoiceId]
    );

    if (revenueRes.rows.length === 0) {
      return null; // Нет связанного дохода
    }

    const revenueId = revenueRes.rows[0].id;

    // Определяем новый статус
    let newStatus = 'invoiced';
    if (status === 'paid') {
      newStatus = 'received';
    } else if (status === 'partial_paid') {
      newStatus = 'invoiced';
    } else if (status === 'overdue') {
      newStatus = 'overdue';
    }

    // Обновляем доход проекта
    const query = `
      UPDATE project_revenues
      SET 
        status = $1,
        actual_date = CASE WHEN $1 = 'received' THEN CURRENT_DATE ELSE actual_date END,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *
    `;

    const { rows } = await db.query(query, [newStatus, revenueId]);
    console.log(`✅ Синхронизация: Оплата счёта ${invoiceId} → Доход ${revenueId} (${newStatus})`);
    return rows[0];
  } catch (error) {
    console.error('❌ Ошибка синхронизации оплаты:', error.message);
    return null;
  }
}

/**
 * Удалить доход проекта при удалении счёта
 * Вызывается после удаления finance_invoices
 */
async function syncInvoiceDeleteToRevenue(invoiceId) {
  if (!invoiceId) return false;

  try {
    const result = await db.query(
      'DELETE FROM project_revenues WHERE invoice_id = $1 RETURNING id',
      [invoiceId]
    );

    if (result.rowCount > 0) {
      console.log(`✅ Синхронизация: Удаление счёта ${invoiceId} → Удалён доход проекта`);
      return true;
    }
    return false;
  } catch (error) {
    console.error('❌ Ошибка синхронизации удаления:', error.message);
    return false;
  }
}

/**
 * Массовая синхронизация существующих счетов
 * Для миграции старых данных
 */
async function syncAllExistingInvoices() {
  console.log('🔄 Массовая синхронизация счетов...');

  const { rows: invoices } = await db.query(`
    SELECT id, project_id, amount_total, issue_date, due_date, title, status
    FROM finance_invoices
    WHERE project_id IS NOT NULL
  `);

  let created = 0;
  let updated = 0;

  for (const invoice of invoices) {
    // Проверяем существует ли уже связанный доход
    const existingRes = await db.query(
      'SELECT id FROM project_revenues WHERE invoice_id = $1',
      [invoice.id]
    );

    if (existingRes.rows.length === 0) {
      // Создаём новый
      await syncInvoiceToRevenue(invoice);
      created++;
    } else {
      // Обновляем статус
      const amountPaidRes = await db.query(
        'SELECT amount_paid, status FROM finance_invoices WHERE id = $1',
        [invoice.id]
      );
      const { amount_paid, status } = amountPaidRes.rows[0];
      await syncInvoicePaymentToRevenue(invoice.id, amount_paid, status);
      updated++;
    }
  }

  console.log(`✅ Готово! Создано: ${created}, Обновлено: ${updated}`);
  return { created, updated };
}

module.exports = {
  syncInvoiceToRevenue,
  syncInvoicePaymentToRevenue,
  syncInvoiceDeleteToRevenue,
  syncAllExistingInvoices,
};
