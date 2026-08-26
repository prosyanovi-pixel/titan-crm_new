#!/usr/bin/env node

/**
 * Скрипт для принудительной перезагрузки фронтенда
 * Убивает процессы на порту 3001 и запускает dev сервер
 */

import { execSync, spawn } from 'child_process';
import { join, dirname } from 'path';
import { existsSync } from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🔄 Принудительная перезагрузка фронтенда...');

/**
 * Находит PID процессов, использующих порт 3001
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
 * Запускает dev сервер в директории фронтенда
 */
function startDevServer() {
    const frontendDir = join(__dirname, '..');
    if (!existsSync(join(frontendDir, 'package.json'))) {
        console.error('❌ Не удалось найти frontend/package.json');
        process.exit(1);
    }

    console.log('🚀 Запуск dev сервера...');
    // Используем spawn без shell, чтобы избежать предупреждений и лишнего слоя оболочки
    const child = spawn('npm', ['run', 'dev'], {
        cwd: frontendDir,
        stdio: 'inherit',
        detached: false,
    });

    child.on('error', (err) => {
        console.error('❌ Ошибка запуска dev сервера:', err.message);
        process.exit(1);
    });

    child.on('exit', (code, signal) => {
        if (signal) {
            console.log(`🛑 Dev сервер остановлен сигналом ${signal}`);
            process.exit(0);
            return;
        }

        if (code !== 0) {
            console.error(`❌ Dev сервер завершился с кодом ${code}`);
            process.exit(code ?? 1);
            return;
        }

        console.log('✅ Dev сервер завершился');
        process.exit(0);
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
const PORT = 3001;

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

// Запуск сервера
startDevServer();