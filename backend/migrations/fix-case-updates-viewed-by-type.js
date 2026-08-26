/**
 * Миграция: исправить тип колонки viewed_by в case_record_updates
 * Изменить с UUID на VARCHAR чтобы хранить простые строковые user IDs
 */

const db = require('../db');

async function migrate() {
  try {
    console.log('📋 Исправление типа колонки viewed_by в case_record_updates...\n');

    // Изменить тип колонки viewed_by с UUID на VARCHAR
    await db.query(`
      ALTER TABLE case_record_updates
      ALTER COLUMN viewed_by TYPE VARCHAR(255);
    `);

    console.log('✅ Колонка viewed_by успешно изменена на VARCHAR(255)');

  } catch (err) {
    if (err.message.includes('does not exist')) {
      console.log('✓ Таблица case_record_updates не существует, пропускаем');
    } else {
      console.error('❌ Ошибка:', err.message);
      throw err;
    }
  }
}

migrate().then(() => {
  console.log('✅ Миграция завершена');
  process.exit(0);
}).catch(err => {
  console.error('❌ Ошибка миграции:', err);
  process.exit(1);
});
