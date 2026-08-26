/**
 * Миграция: добавить таблицу для отслеживания обновлений записей
 */

const db = require('../db');

async function migrate() {
  try {
    console.log('📋 Создание таблицы case_record_updates...\n');

    // Создать таблицу если её нет
    await db.query(`
      CREATE TABLE IF NOT EXISTS case_record_updates (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        case_id VARCHAR(255) NOT NULL,
        lawyer_id VARCHAR(255),
        update_type VARCHAR(50) DEFAULT 'case_update', -- 'case_update', 'case_note', 'document_added'
        title VARCHAR(255),
        description TEXT,
        is_viewed BOOLEAN DEFAULT false,
        viewed_at TIMESTAMP,
        viewed_by VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        
        FOREIGN KEY (case_id) REFERENCES legal_cases(id) ON DELETE CASCADE
      );
    `);

    console.log('✅ Таблица case_record_updates создана');

    // Создать индексы
    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_case_record_updates_case_id 
      ON case_record_updates(case_id);
    `);

    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_case_record_updates_is_viewed 
      ON case_record_updates(is_viewed);
    `);

    console.log('✅ Индексы созданы');

  } catch (err) {
    if (err.message.includes('already exists')) {
      console.log('✓ Таблица уже существует');
    } else {
      console.error('❌ Ошибка:', err.message);
      throw err;
    }
  } finally {
    process.exit(0);
  }
}

migrate();
