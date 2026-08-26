/**
 * TITAN CRM — Единый скрипт для заполнения базы данных
 * Использование: npm run seed:all
 */

const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const readline = require('readline');

// Загружаем переменные окружения
require('dotenv').config({ path: path.join(__dirname, '../env') });

const { DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME } = process.env;

if (!DB_HOST || !DB_USER || !DB_NAME) {
    console.error('❌ Ошибка: Не настроены переменные окружения БД (DB_HOST, DB_USER, DB_NAME)');
    console.error('Проверьте файл backend/env');
    process.exit(1);
}

// Создаем rl для ввода пользователя
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// Главный SQL файл
const sqlFile = path.join(__dirname, '../seeds/seed_all.sql');

console.log('🌱 TITAN CRM — Заполнение базы данных\n');
console.log(`   БД: ${DB_NAME}@${DB_HOST}:${DB_PORT}`);
console.log(`   Пользователь: ${DB_USER}`);
console.log('');

// Проверяем существование файла
if (!fs.existsSync(sqlFile)) {
    console.error(`❌ Ошибка: Файл ${sqlFile} не найден`);
    process.exit(1);
}

// Предупреждение
console.log('⚠️  ВНИМАНИЕ: Этот скрипт заполнит базу данных справочными данными.');
console.log('   Существующие данные могут быть обновлены (используется ON CONFLICT).\n');

rl.question('Продолжить? (y/n): ', (answer) => {
    rl.close();
    
    if (answer.toLowerCase() !== 'y') {
        console.log('❌ Отменено пользователем');
        process.exit(0);
    }
    
    console.log('\n📊 Заполнение базы данных...\n');

    // Cross-platform command
    const isWindows = process.platform === 'win32';
    let command;

    if (isWindows) {
        // Windows: use set PGPASSWORD=&& psql
        const psqlExe = process.env.PSQL_PATH || 'psql';
        command = `set PGPASSWORD=${DB_PASSWORD} && "${psqlExe}" -h ${DB_HOST} -p ${DB_PORT} -U ${DB_USER} -d ${DB_NAME} -f "${sqlFile}"`;
    } else {
        // Unix/Linux/macOS
        command = `PGPASSWORD="${DB_PASSWORD}" psql -h ${DB_HOST} -p ${DB_PORT} -U ${DB_USER} -d ${DB_NAME} -f ${sqlFile}`;
    }
    
    exec(command, (error, stdout, stderr) => {
        if (error) {
            console.error(`❌ Ошибка выполнения: ${error.message}`);
            process.exit(1);
        }
        
        // Выводим вывод PostgreSQL
        console.log(stdout);
        
        // Проверяем на ошибки
        if (stderr && stderr.includes('ERROR')) {
            console.error(`❌ Ошибка БД: ${stderr}`);
            process.exit(1);
        }
        
        // Подсчитываем количество INSERT
        const insertCount = (stdout.match(/INSERT 0/g) || []).length;
        
        console.log('\n✅ Успешно завершено!');
        console.log(`   Выполнено INSERT операций: ${insertCount}`);
        console.log('\n📊 База данных заполнена справочными данными.');
        console.log('   Теперь вы можете войти в систему под администратором.\n');
        
        process.exit(0);
    });
});
