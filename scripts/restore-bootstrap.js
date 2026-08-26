#!/usr/bin/env node
/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║          TITAN CRM — Bootstrap / Portable Restore           ║
 * ╠══════════════════════════════════════════════════════════════╣
 * ║  Требования: Node.js >= 16, PostgreSQL (psql в PATH)        ║
 * ║  npm-пакеты: НЕ нужны — работает на чистой системе         ║
 * ╠══════════════════════════════════════════════════════════════╣
 * ║  Использование:                                             ║
 * ║    1. Положите этот файл рядом с backup-файлом (.zip)       ║
 * ║    2. node restore-bootstrap.js                             ║
 * ║    3. Следуйте инструкциям                                  ║
 * ╚══════════════════════════════════════════════════════════════╝
 */

'use strict';

const fs      = require('fs');
const path    = require('path');
const os      = require('os');
const zlib    = require('zlib');
const crypto  = require('crypto');
const { execSync, spawnSync } = require('child_process');
const readline = require('readline');

// ─── Цвета в терминале ───────────────────────────────────────────────────────
const C = {
  reset:  '\x1b[0m',
  bold:   '\x1b[1m',
  red:    '\x1b[31m',
  green:  '\x1b[32m',
  yellow: '\x1b[33m',
  cyan:   '\x1b[36m',
  gray:   '\x1b[90m',
};
const ok    = (s) => console.log(`${C.green}   ✅ ${s}${C.reset}`);
const info  = (s) => console.log(`${C.cyan}   ℹ️  ${s}${C.reset}`);
const warn  = (s) => console.log(`${C.yellow}   ⚠️  ${s}${C.reset}`);
const err   = (s) => console.error(`${C.red}   ❌ ${s}${C.reset}`);
const head  = (s) => console.log(`\n${C.bold}${C.cyan}${'─'.repeat(60)}\n   ${s}\n${'─'.repeat(60)}${C.reset}`);

function ask(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise(resolve => rl.question(question, ans => { rl.close(); resolve(ans.trim()); }));
}

// ─── Минимальный ZIP-парсер (только встроенный zlib) ─────────────────────────
// Поддерживает методы: 0 (store) и 8 (deflate).
// Достаточно для архивов, создаваемых модулем archiver (Node.js).

function readUInt16LE(buf, off) { return buf[off] | (buf[off + 1] << 8); }
function readUInt32LE(buf, off) {
  return (buf[off] | (buf[off+1] << 8) | (buf[off+2] << 16) | (buf[off+3] << 24)) >>> 0;
}

/**
 * Парсит ZIP-буфер и возвращает список записей.
 * @returns {{ name: string, data: Buffer }[]}
 */
function parseZip(buf) {
  const entries = [];

  // Ищем End of Central Directory (EOCD) с конца
  let eocdOffset = -1;
  for (let i = buf.length - 22; i >= 0; i--) {
    if (readUInt32LE(buf, i) === 0x06054b50) { eocdOffset = i; break; }
  }
  if (eocdOffset === -1) throw new Error('Не найден EOCD — файл повреждён или не является ZIP');

  const cdCount  = readUInt16LE(buf, eocdOffset + 8);
  let   cdOffset = readUInt32LE(buf, eocdOffset + 16);

  for (let i = 0; i < cdCount; i++) {
    if (readUInt32LE(buf, cdOffset) !== 0x02014b50)
      throw new Error(`Ожидался Central Directory Header по offset ${cdOffset}`);

    const method      = readUInt16LE(buf, cdOffset + 10);
    const compSize    = readUInt32LE(buf, cdOffset + 20);
    const uncompSize  = readUInt32LE(buf, cdOffset + 24);
    const nameLen     = readUInt16LE(buf, cdOffset + 28);
    const extraLen    = readUInt16LE(buf, cdOffset + 30);
    const commentLen  = readUInt16LE(buf, cdOffset + 32);
    const localOffset = readUInt32LE(buf, cdOffset + 42);
    const name        = buf.slice(cdOffset + 46, cdOffset + 46 + nameLen).toString('utf8');

    cdOffset += 46 + nameLen + extraLen + commentLen;

    // Каталоги пропускаем
    if (name.endsWith('/')) continue;

    // Local File Header
    if (readUInt32LE(buf, localOffset) !== 0x04034b50)
      throw new Error(`Ожидался Local File Header для "${name}"`);
    const localNameLen  = readUInt16LE(buf, localOffset + 26);
    const localExtraLen = readUInt16LE(buf, localOffset + 28);
    const dataOffset    = localOffset + 30 + localNameLen + localExtraLen;

    const compressed = buf.slice(dataOffset, dataOffset + compSize);
    let data;
    if (method === 0) {
      data = compressed;
    } else if (method === 8) {
      data = zlib.inflateRawSync(compressed);
    } else {
      warn(`Пропущен "${name}": метод сжатия ${method} не поддерживается`);
      continue;
    }

    if (data.length !== uncompSize)
      warn(`Размер "${name}" не совпадает (${data.length} vs ${uncompSize})`);

    entries.push({ name, data });
  }

  return entries;
}

/**
 * Извлекает ZIP в указанную директорию.
 * @returns {number} Количество файлов
 */
function extractZip(zipPath, destDir) {
  info(`Читаем архив: ${path.basename(zipPath)} (${(fs.statSync(zipPath).size / 1024 / 1024).toFixed(1)} MB)`);
  const buf     = fs.readFileSync(zipPath);
  const entries = parseZip(buf);
  let   count   = 0;

  for (const entry of entries) {
    const dest = path.join(destDir, entry.name);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.writeFileSync(dest, entry.data);
    count++;
  }

  return count;
}

// ─── Поиск psql ──────────────────────────────────────────────────────────────
function findPsql() {
  const envVal = (process.env.PSQL_PATH || '').trim();
  if (envVal && fs.existsSync(envVal)) return envVal;

  const platform = os.platform();
  try {
    const cmd   = platform === 'win32' ? 'where psql' : 'which psql';
    const found = execSync(cmd, { stdio: ['ignore', 'pipe', 'ignore'] })
      .toString().trim().split(/\r?\n/)[0].trim();
    if (found) return found;
  } catch (_) {}

  const versions = ['18','17','16','15','14','13','12'];
  const candidates = {
    win32:  versions.flatMap(v => [
      `C:\\Program Files\\PostgreSQL\\${v}\\bin\\psql.exe`,
      `C:\\Program Files (x86)\\PostgreSQL\\${v}\\bin\\psql.exe`,
    ]),
    darwin: [
      ...versions.flatMap(v => [
        `/Applications/Postgres.app/Contents/Versions/${v}/bin/psql`,
        `/Library/PostgreSQL/${v}/bin/psql`,
      ]),
      '/opt/homebrew/bin/psql', '/usr/local/bin/psql', '/usr/bin/psql',
    ],
    linux:  ['/usr/bin/psql', '/usr/local/bin/psql'],
  };
  for (const p of (candidates[platform] || candidates.linux)) {
    if (fs.existsSync(p)) return p;
  }
  return 'psql';
}

// ─── Парсинг .env файла ───────────────────────────────────────────────────────
function parseEnvFile(content) {
  const result = {};
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let   val = trimmed.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    result[key] = val;
  }
  return result;
}

// ─── Запуск команды с выводом ─────────────────────────────────────────────────
function run(cmd, opts = {}) {
  const result = spawnSync(cmd, { shell: true, encoding: 'utf8', ...opts });
  if (result.error) throw result.error;
  return result;
}

// ─── Главная функция ──────────────────────────────────────────────────────────
async function main() {
  console.log(`\n${C.bold}${C.cyan}${'═'.repeat(60)}`);
  console.log('   TITAN CRM — Bootstrap Restore');
  console.log(`${'═'.repeat(60)}${C.reset}\n`);

  // 1. Находим ZIP-архив ──────────────────────────────────────────────────────
  head('Шаг 1 / 5 — Поиск архива');

  let zipPath = process.argv[2];

  if (!zipPath) {
    const dir  = process.cwd();
    const zips = fs.readdirSync(dir).filter(f => f.endsWith('.zip'));
    if (zips.length === 0) {
      err('Не найден ни один .zip файл в текущей папке.');
      err('Положите restore-bootstrap.js рядом с backup-архивом и повторите.');
      process.exit(1);
    }
    if (zips.length === 1) {
      zipPath = path.join(dir, zips[0]);
      ok(`Найден архив: ${zips[0]}`);
    } else {
      console.log('   Найдено несколько архивов:');
      zips.forEach((z, i) => console.log(`   ${i + 1}. ${z}`));
      const choice = await ask('\n❓ Выберите номер архива: ');
      const idx = parseInt(choice) - 1;
      if (isNaN(idx) || idx < 0 || idx >= zips.length) {
        err('Неверный выбор'); process.exit(1);
      }
      zipPath = path.join(dir, zips[idx]);
      ok(`Выбран: ${zips[idx]}`);
    }
  } else {
    zipPath = path.resolve(zipPath);
    if (!fs.existsSync(zipPath)) { err(`Файл не найден: ${zipPath}`); process.exit(1); }
    ok(`Архив: ${path.basename(zipPath)}`);
  }

  // 2. Куда распаковываем ─────────────────────────────────────────────────────
  head('Шаг 2 / 5 — Целевая директория');

  const defaultDest = path.join(process.cwd(), 'titan-crm');
  info(`По умолчанию: ${defaultDest}`);
  const destInput = await ask(`❓ Папка назначения [Enter = по умолчанию]: `);
  const destDir   = destInput ? path.resolve(destInput) : defaultDest;

  if (fs.existsSync(destDir)) {
    warn(`Папка уже существует: ${destDir}`);
    const ow = await ask('   Перезаписать содержимое? (yes/no): ');
    if (ow.toLowerCase() !== 'yes') {
      info('Отменено.'); process.exit(0);
    }
  } else {
    fs.mkdirSync(destDir, { recursive: true });
  }

  ok(`Цель: ${destDir}`);

  // 3. Распаковка ────────────────────────────────────────────────────────────
  head('Шаг 3 / 5 — Распаковка архива');

  let fileCount;
  try {
    fileCount = extractZip(zipPath, destDir);
    ok(`Распаковано файлов: ${fileCount}`);
  } catch (e) {
    err(`Ошибка распаковки: ${e.message}`); process.exit(1);
  }

  // 4. Читаем конфиг БД из backend/env ────────────────────────────────────────
  head('Шаг 4 / 5 — Конфигурация базы данных');

  const envFile   = path.join(destDir, 'backend', 'env');
  const envExample = path.join(destDir, 'backend', 'env.example');

  if (!fs.existsSync(envFile)) {
    err('Файл backend/env не найден в архиве.');
    if (fs.existsSync(envExample)) {
      const ex = fs.readFileSync(envExample, 'utf8');
      const lines = ex.split('\n').filter(l => /^(DB_|PORT)/.test(l.trim()));
      warn('Обязательные переменные (из env.example):');
      lines.forEach(l => console.log(`   ${C.gray}${l}${C.reset}`));
    }
    err(`Создайте файл ${envFile} и повторите запуск.`);
    process.exit(1);
  }

  const envVars = parseEnvFile(fs.readFileSync(envFile, 'utf8'));
  const dbHost  = envVars.DB_HOST     || 'localhost';
  const dbPort  = envVars.DB_PORT     || '5432';
  const dbName  = envVars.DB_NAME;
  const dbUser  = envVars.DB_USER;
  const dbPass  = envVars.DB_PASSWORD || '';

  if (!dbName || !dbUser) {
    err(`В файле ${envFile} не найдены DB_NAME или DB_USER.`);
    err('Проверьте файл и повторите запуск.'); process.exit(1);
  }

  ok(`Хост: ${dbHost}:${dbPort}`);
  ok(`База: ${dbName}  |  Пользователь: ${dbUser}`);

  // Ищем SQL-дамп (корневой .sql файл в архиве)
  const sqlFile = path.join(destDir, 'database.sql');
  if (!fs.existsSync(sqlFile)) {
    err('SQL-дамп (database.sql) не найден в архиве.');
    err('Возможно, архив создан не через backup:full — используйте именно его.'); process.exit(1);
  }

  // Находим psql
  const psql = findPsql();
  info(`psql: ${psql}`);
  const pgEnv = { ...process.env, PGPASSWORD: dbPass };

  // Проверяем подключение к PostgreSQL
  const pingResult = run(
    `"${psql}" -h "${dbHost}" -p ${dbPort} -U "${dbUser}" -d postgres -c "SELECT 1" --no-psqlrc -q`,
    { env: pgEnv }
  );
  if (pingResult.status !== 0) {
    err('Не удалось подключиться к PostgreSQL.');
    if (pingResult.stderr) console.error(`   ${C.gray}${pingResult.stderr.trim()}${C.reset}`);
    err('Убедитесь что PostgreSQL запущен и пользователь существует.');
    process.exit(1);
  }
  ok('PostgreSQL доступен');

  // Создаём БД если не существует
  const checkDb = run(
    `"${psql}" -h "${dbHost}" -p ${dbPort} -U "${dbUser}" -d "${dbName}" -c "SELECT 1" --no-psqlrc -q`,
    { env: pgEnv }
  );
  if (checkDb.status !== 0) {
    info(`База "${dbName}" не найдена — создаём...`);
    const createResult = run(
      `"${psql}" -h "${dbHost}" -p ${dbPort} -U "${dbUser}" -d postgres -c "CREATE DATABASE \\"${dbName}\\" ENCODING 'UTF8'"`,
      { env: pgEnv }
    );
    if (createResult.status !== 0) {
      err(`Не удалось создать базу: ${createResult.stderr}`); process.exit(1);
    }
    ok(`База "${dbName}" создана`);
  } else {
    ok(`База "${dbName}" уже существует`);
  }

  // 5. Восстановление БД ─────────────────────────────────────────────────────
  head('Шаг 5 / 5 — Восстановление базы данных');

  const sqlSizeMb = (fs.statSync(sqlFile).size / 1024 / 1024).toFixed(2);
  info(`Файл дампа: ${sqlFile} (${sqlSizeMb} MB)`);

  const confirm = await ask('⚠️  Это перезапишет базу данных. Продолжить? (yes/no): ');
  if (confirm.toLowerCase() !== 'yes') { info('Отменено.'); process.exit(0); }

  info('Выполняется psql...');
  const restoreResult = run(
    `"${psql}" -h "${dbHost}" -p ${dbPort} -U "${dbUser}" -d "${dbName}" -f "${sqlFile}"`,
    { env: pgEnv, maxBuffer: 100 * 1024 * 1024 }
  );

  if (restoreResult.status !== 0) {
    err('Ошибка при восстановлении:');
    if (restoreResult.stderr) console.error(`   ${C.gray}${restoreResult.stderr.slice(0, 2000)}${C.reset}`);
    process.exit(1);
  }
  if (restoreResult.stderr && restoreResult.stderr.trim()) {
    warn('Предупреждения psql (обычно безопасны):');
    console.log(`   ${C.gray}${restoreResult.stderr.trim().split('\n').slice(0, 5).join('\n   ')}${C.reset}`);
  }

  ok('База данных успешно восстановлена');

  // Удаляем временный SQL-файл из папки проекта
  try { fs.unlinkSync(sqlFile); } catch (_) {}

  // ─── Итого ──────────────────────────────────────────────────────────────────
  // Форматируем пути для удобства (сокращенные или относительные)
  const displayPath = destDir.startsWith(process.env.HOME || '/root') 
    ? '~' + destDir.slice((process.env.HOME || '/root').length)
    : destDir;
  const backendPath = path.join(displayPath, 'backend');
  const frontendPath = path.join(displayPath, 'frontend');

  console.log(`\n${C.bold}${C.green}${'═'.repeat(60)}`);
  console.log('   ✅  TITAN CRM успешно восстановлен!');
  console.log(`${'═'.repeat(60)}${C.reset}`);
  console.log(`\n   📁 Проект:   ${displayPath}`);
  console.log(`   🗄️  База:      ${dbName} @ ${dbHost}:${dbPort}`);
  console.log(`   📦 Файлов:   ${fileCount}`);
  console.log(`\n${C.bold}   Следующие шаги:${C.reset}`);
  console.log(`   1. cd "${backendPath}"`);
  console.log(`   2. npm install`);
  console.log(`   3. npm run dev`);
  console.log(`\n   В другом терминале:`);
  console.log(`   4. cd "${frontendPath}"`);
  console.log(`   5. npm install`);
  console.log(`   6. npm run dev\n`);
}

main().catch(e => {
  err(e.message);
  process.exit(1);
});
