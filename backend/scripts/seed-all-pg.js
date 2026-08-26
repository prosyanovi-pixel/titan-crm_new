const fs = require('fs');
const path = require('path');
const db = require('../db');

// Main SQL file
const sqlFile = path.join(__dirname, '../seeds/seed_all.sql');

console.log('🌱 TITAN CRM — Заполнение базы данных через pg...');

if (!fs.existsSync(sqlFile)) {
  console.error(`❌ Ошибка: Файл ${sqlFile} не найден`);
  process.exit(1);
}

const sql = fs.readFileSync(sqlFile, 'utf8');

async function run() {
  try {
    console.log('📊 Выполнение SQL запросов...');
    
    // pg pool.query can execute multiple queries separated by semicolons
    await db.pool.query(sql);
    
    console.log('\n✅ Успешно завершено!');
    console.log('📊 База данных заполнена справочными данными.');
    console.log('   Теперь вы можете войти в систему под администратором.\n');
    process.exit(0);
  } catch (error) {
    console.error('❌ Ошибка выполнения сидирования:', error);
    process.exit(1);
  }
}

run();
