/**
 * Seed script: Заполнение module_settings базовыми настройками массового редактирования
 * Использование: npm run seed:bulk-edit
 */

const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

// Загружаем переменные окружения
require('dotenv').config({ path: path.join(__dirname, '../env') });

const { DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME } = process.env;

if (!DB_HOST || !DB_USER || !DB_NAME) {
    console.error('❌ Ошибка: Не настроены переменные окружения БД (DB_HOST, DB_USER, DB_NAME)');
    console.error('Проверьте файл backend/env');
    process.exit(1);
}

const sqlFile = path.join(__dirname, 'seed_bulk_edit_settings.sql');

if (!fs.existsSync(sqlFile)) {
    console.error(`❌ Ошибка: Файл ${sqlFile} не найден`);
    process.exit(1);
}

console.log('🌱 Заполнение таблицы module_settings настройками массового редактирования...');
console.log(`   БД: ${DB_NAME}@${DB_HOST}:${DB_PORT}`);
console.log(`   Пользователь: ${DB_USER}`);

const command = `PGPASSWORD="${DB_PASSWORD}" psql -h ${DB_HOST} -p ${DB_PORT} -U ${DB_USER} -d ${DB_NAME} -f ${sqlFile}`;

exec(command, (error, stdout, stderr) => {
    if (error) {
        console.error(`❌ Ошибка выполнения: ${error.message}`);
        process.exit(1);
    }
    
    if (stderr && !stderr.includes('INSERT') && !stderr.includes('ON CONFLICT')) {
        console.error(`❌ Ошибка БД: ${stderr}`);
        process.exit(1);
    }
    
    console.log('✅ Успешно!');
    console.log(stdout);
    
    // Подсчитываем количество записей
    const insertCount = (stdout.match(/INSERT/g) || []).length;
    const updateCount = (stdout.match(/ON CONFLICT/g) || []).length;
    
    console.log(`   Добавлено записей: ${insertCount}`);
    console.log(`   Обновлено записей: ${updateCount}`);
    console.log('\n📊 Настройки массового редактирования доступны для всех модулей!');
});
