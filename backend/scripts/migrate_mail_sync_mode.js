
const db = require('../db');

async function migrate() {
  try {
    console.log('Migrating mail_accounts table...');
    
    // Добавляем колонку sync_mode, если её нет
    await db.query(`
      ALTER TABLE mail_accounts 
      ADD COLUMN IF NOT EXISTS sync_mode VARCHAR(20) DEFAULT 'light';
    `);

    // Добавляем индекс для ускорения списка писем (user_id, folder_id, date)
    console.log('Adding performance index to mail table...');
    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_mail_list_performance 
      ON mail(user_id, folder_id, date DESC);
    `);

    console.log('✅ Migration completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

migrate();
