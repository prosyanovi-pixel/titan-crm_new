#!/usr/bin/env node

/**
 * Скрипт для принудительной перезагрузки бэкенда
 * Убивает процессы на порту 5001 и запускает dev сервер (nodemon)
 */

import { execSync, spawn } from 'child_process';
import { join, dirname } from 'path';
import { existsSync } from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🔄 Принудительная перезагрузка бэкенда...');

/**
 * Находит PID процессов, использующих порт 5001
 * @returns {number[]} массив PID
 */
function findPidsOnPort(port) {
    try {
        const output = execSync(`lsof -ti:${port}`, { encoding: 'utf8' }).trim();
        if (!output) return [];
        return output.split('\n').map(pid => parseInt(pid, 10)).filter(pid => !isNaN(pid));
    } catch (err) {
        // lsof возвращает ненулевой код, если процессов нет
        return [];
    }
}

/**
 * Убивает процессы по PID
 * @param {number[]} pids
 */
function killPids(pids) {
    if (pids.length === 0) return;
    console.log(`🛑 Найдены процессы: ${pids.join(', ')}`);
    console.log('🗑️  Убиваем процессы...');
    try {
        execSync(`kill -9 ${pids.join(' ')}`);
        // Даём время на завершение
        setTimeout(() => {}, 500);
    } catch (err) {
        // Игнорируем ошибки, если процессы уже завершились
    }
    console.log('✅ Процессы убиты');
}

/**
 * Проверяет, свободен ли порт
 * @param {number} port
 * @returns {boolean}
 */
function isPortFree(port) {
    const pids = findPidsOnPort(port);
    return pids.length === 0;
}

/**
 * Проверяет и чинит PostgreSQL (зависшие PID файлы на MacOS, подсказки на других ОС)
 */
function checkAndFixPostgres() {
    try {
        console.log('🔍 Проверка статуса PostgreSQL...');
        execSync('pg_isready -q', { stdio: 'ignore' });
    } catch (err) {
        console.log('⚠️ PostgreSQL не отвечает.');
        
        if (process.platform === 'linux') {
            console.log('💡 Подсказка (Linux): Убедитесь, что служба запущена. Попробуйте выполнить:');
            console.log('   sudo systemctl restart postgresql');
            console.log('   Если остался зависший pid-файл (FATAL: lock file "postmaster.pid" already exists), удалите его.');
            console.log('   Обычно он находится в /var/lib/postgresql/<версия>/main/postmaster.pid');
            return;
        }
        
        if (process.platform === 'win32') {
            console.log('💡 Подсказка (Windows): Убедитесь, что служба запущена. Попробуйте выполнить (от имени Администратора):');
            console.log('   net stop postgresql && net start postgresql');
            console.log('   Если остался зависший pid-файл, удалите его из папки данных PostgreSQL (например, C:\\Program Files\\PostgreSQL\\<версия>\\data\\postmaster.pid)');
            return;
        }

        if (process.platform === 'darwin') {
            console.log('⚠️ Проверяем зависшие lock-файлы Homebrew...');
            try {
                const paths = [
                    '/opt/homebrew/var/postgresql@17/postmaster.pid',
                    '/opt/homebrew/var/postgresql@16/postmaster.pid',
                    '/opt/homebrew/var/postgresql@15/postmaster.pid',
                    '/opt/homebrew/var/postgresql@14/postmaster.pid',
                    '/opt/homebrew/var/postgres/postmaster.pid',
                    '/usr/local/var/postgresql@17/postmaster.pid',
                    '/usr/local/var/postgresql@16/postmaster.pid',
                    '/usr/local/var/postgresql@15/postmaster.pid',
                    '/usr/local/var/postgresql@14/postmaster.pid',
                    '/usr/local/var/postgres/postmaster.pid'
                ];
                
                let fixed = false;
                for (const p of paths) {
                    if (existsSync(p)) {
                        console.log(`🗑️ Удаляем зависший lock-файл: ${p}`);
                        execSync(`rm -f ${p}`);
                        
                        const match = p.match(/postgresql(?:@[0-9]+)?|postgres/);
                        if (match) {
                            const serviceName = match[0];
                            console.log(`🔄 Перезапускаем сервис ${serviceName}...`);
                            execSync(`brew services restart ${serviceName}`, { stdio: 'ignore' });
                            fixed = true;
                        }
                        break;
                    }
                }
                if (fixed) {
                    console.log('✅ PostgreSQL восстановлен (ожидаем запуска...)');
                    execSync('sleep 3');
                } else {
                    console.log('ℹ️ Зависший lock-файл не найден. Убедитесь, что БД запущена.');
                }
            } catch (innerErr) {
                console.log('❌ Ошибка при проверке PostgreSQL:', innerErr.message);
            }
        }
    }
}

/**
 * Запускает dev сервер в директории бэкенда
 */
function startDevServer() {
    const backendDir = join(__dirname, '..');
    if (!existsSync(join(backendDir, 'package.json'))) {
        console.error('❌ Не удалось найти backend/package.json');
        process.exit(1);
    }

    console.log('🚀 Запуск dev сервера (nodemon)...');
    // Используем spawn для запуска в фоне с наследованием stdio
    const child = spawn('npm', ['run', 'dev'], {
        cwd: backendDir,
        stdio: 'inherit',
        shell: true,
        detached: false,
    });

    child.on('error', (err) => {
        console.error('❌ Ошибка запуска dev сервера:', err.message);
        process.exit(1);
    });

    child.on('exit', (code) => {
        if (code !== 0) {
            console.error(`❌ Dev сервер завершился с кодом ${code}`);
        }
    });

    // Обработка сигналов для корректного завершения
    process.on('SIGINT', () => {
        console.log('\n🛑 Получен SIGINT, завершаем...');
        child.kill('SIGINT');
        process.exit(0);
    });

    process.on('SIGTERM', () => {
        console.log('\n🛑 Получен SIGTERM, завершаем...');
        child.kill('SIGTERM');
        process.exit(0);
    });

    console.log('✅ Dev сервер запущен. Нажмите Ctrl+C для остановки.');
}

// Основная логика
const PORT = 5001;

console.log(`🔍 Поиск процессов на порту ${PORT}...`);
const pids = findPidsOnPort(PORT);

if (pids.length > 0) {
    killPids(pids);
} else {
    console.log('✅ Нет процессов на порту', PORT);
}

// Двойная проверка
if (!isPortFree(PORT)) {
    console.log('⚠️  Предупреждение: порт всё ещё занят, повторная попытка...');
    const pids2 = findPidsOnPort(PORT);
    killPids(pids2);
}

// Проверяем PostgreSQL на MacOS
checkAndFixPostgres();

// Запуск сервера
startDevServer();