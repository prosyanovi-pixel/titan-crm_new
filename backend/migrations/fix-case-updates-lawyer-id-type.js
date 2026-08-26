/**
 * Миграция: исправить тип колонки lawyer_id в case_record_updates
 * Изменить с UUID на VARCHAR чтобы хранить строковые user IDs
 */

const db = require('../db');

async function migrate() {
  try {
    console.log('📋 Исправление типа колонки lawyer_id в case_record_updates...\n');

    await db.query(`
      ALTER TABLE case_record_updates
      ALTER COLUMN lawyer_id TYPE VARCHAR(255);
    `);

    console.log('✅ Колонка lawyer_id успешно изменена на VARCHAR(255)');

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
