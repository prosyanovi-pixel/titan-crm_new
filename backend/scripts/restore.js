// Interactive restore script
// Поддерживает два режима:
// 1. Через API (требует запущенный backend)
// 2. Прямое восстановление (без backend сервера)
const readline = require('readline');
const http = require('http');
const path = require('path');
const fs = require('fs');
const { exec, execSync } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);
const unzipper = require('unzipper');
const os = require('os');

// Загружаем переменные окружения из файла env в родительской директории
require('dotenv').config({ path: path.join(__dirname, '..', 'env') });

const API_URL = process.env.API_URL;
const BACKUP_DIR = path.join(__dirname, '../backups');

// Режим работы: пытаемся через API, если не получается - прямое восстановление
let USE_DIRECT_MODE = false;

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function makeRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, API_URL);
    const options = {
      method: method,
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 300000 // 5 минут timeout для восстановления
    };

    const req = http.request(url, options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          if (res.statusCode >= 400) {
            const serverMessage = parsed?.message || parsed?.error || JSON.stringify(parsed);
            const error = new Error(`HTTP ${res.statusCode}: ${serverMessage}`);
            error.status = res.statusCode;
            error.body = parsed;
            reject(error);
          } else {
            resolve(parsed);
          }
        } catch (e) {
          if (res.statusCode >= 400) {
            const error = new Error(`HTTP ${res.statusCode}: ${body || 'Пустой ответ сервера'}`);
            error.status = res.statusCode;
            error.body = body;
            reject(error);
          } else {
            resolve(body);
          }
        }
      });
    });

    req.setTimeout(300000, () => {
      req.destroy();
      reject(new Error('Request timeout after 5 minutes'));
    });

    req.on('error', (error) => {
      if (error.code === 'ECONNREFUSED') {
        reject(new Error(`Не удалось подключиться к API (${API_URL}). Запустите backend: npm run dev`));
        return;
      }

      reject(error);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

/**
 * Автоопределение пути к PostgreSQL бинарнику
 */
function findPgBinary(name) {
  const envKey = name === 'pg_dump' ? 'PG_DUMP_PATH' : 'PSQL_PATH';
  const envVal = (process.env[envKey] || '').trim();
  if (envVal) return envVal;

  const platform = os.platform();

  try {
    const whichCmd = platform === 'win32' ? `where ${name}` : `which ${name}`;
    const found = execSync(whichCmd, { stdio: ['ignore', 'pipe', 'ignore'] })
      .toString().trim().split(/\r?\n/)[0].trim();
    if (found) return found;
  } catch (_) {}

  const versions = ['18', '17', '16', '15', '14', '13', '12'];
  const candidates = {
    win32: versions.flatMap(v => [
      `C:\\Program Files\\PostgreSQL\\${v}\\bin\\${name}.exe`,
      `C:\\Program Files (x86)\\PostgreSQL\\${v}\\bin\\${name}.exe`,
    ]),
    darwin: [
      ...versions.flatMap(v => [
        `/Applications/Postgres.app/Contents/Versions/${v}/bin/${name}`,
        `/Library/PostgreSQL/${v}/bin/${name}`,
        `/opt/local/lib/postgresql${v}/bin/${name}`,
      ]),
      `/opt/homebrew/bin/${name}`,
      `/usr/local/bin/${name}`,
      `/opt/local/bin/${name}`,
    ],
    linux: [`/usr/bin/${name}`, `/usr/local/bin/${name}`],
  };

  const list = candidates[platform] || candidates.linux;
  for (const p of list) {
    if (fs.existsSync(p)) return p;
  }

  return name;
}

function getDbConfig() {
  const config = {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD
  };
  
  const required = ['host', 'port', 'database', 'user'];
  const missing = required.filter(f => !config[f]);
  if (missing.length) throw new Error(`Missing env vars: ${missing.join(', ')}`);
  
  return config;
}

function listBackupsLocal() {
  if (!fs.existsSync(BACKUP_DIR)) return [];
  return fs.readdirSync(BACKUP_DIR)
    .filter(f => f.endsWith('.zip'))
    .map(f => {
      const filePath = path.join(BACKUP_DIR, f);
      const stats = fs.statSync(filePath);
      return {
        name: f.replace('.zip', ''),
        file: f,
        size: stats.size,
        created: stats.mtime.toISOString()
      };
    })
    .sort((a, b) => new Date(b.created) - new Date(a.created));
}

async function listBackups() {
  if (USE_DIRECT_MODE) {
    return listBackupsLocal();
  }
  
  try {
    const response = await makeRequest('GET', '/api/backup/list');
    const backups = Array.isArray(response) ? response : (response.data || response.backups || []);
    return backups;
  } catch (error) {
    console.log('⚠️  Не удалось подключиться к API, переключаемся на прямой режим');
    USE_DIRECT_MODE = true;
    return listBackupsLocal();
  }
}

function formatSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}

function formatDate(dateString) {
  return new Date(dateString).toLocaleString('ru-RU');
}

function askQuestion(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

/**
 * Создаёт БД, если она не существует (нужно при переносе на новый сервер)
 */
async function ensureDatabase(config) {
  const psqlPath = findPgBinary('psql');
  const env = { ...process.env, PGPASSWORD: config.password };
  try {
    await execAsync(
      `"${psqlPath}" -h "${config.host}" -p ${config.port} -U "${config.user}" -d "${config.database}" -c "SELECT 1" --no-psqlrc -q`,
      { env }
    );
    return; // БД уже есть
  } catch (_) {}
  console.log(`   ℹ️  База "${config.database}" не найдена, создаём...`);
  await execAsync(
    `"${psqlPath}" -h "${config.host}" -p ${config.port} -U "${config.user}" -d postgres -c "CREATE DATABASE \\"${config.database}\\" ENCODING 'UTF8'"`,
    { env }
  );
  console.log(`   ✅ База "${config.database}" создана`);
}

async function restoreDirect(backupFile) {
  console.log('\n🔄 Прямое восстановление...');

  const config      = getDbConfig();
  const backupPath  = path.join(BACKUP_DIR, backupFile);
  const extractDir  = path.join(BACKUP_DIR, `temp-restore-${Date.now()}`);
  const projectRoot = path.join(__dirname, '..', '..');

  try {
    console.log('📦 Извлечение архива...');

    // Извлекаем SQL-дамп + файлы проекта (full-backup)
    let sqlFile   = null;
    let fileCount = 0;
    const pending = [];

    if (fs.existsSync(extractDir)) fs.rmSync(extractDir, { recursive: true, force: true });
    fs.mkdirSync(extractDir, { recursive: true });

    await new Promise((resolve, reject) => {
      let hasError = false;
      const readStream = fs.createReadStream(backupPath);
      readStream.on('error', (err) => { hasError = true; reject(err); });

      readStream
        .pipe(require('unzipper').Parse())
        .on('entry', (entry) => {
          if (hasError) { entry.autodrain(); return; }
          const { path: entryPath, type } = entry;
          if (type !== 'File') { entry.autodrain(); return; }

          const isRootSql = !entryPath.includes('/') && entryPath.endsWith('.sql');

          if (isRootSql) {
            const dest = path.join(extractDir, path.basename(entryPath));
            const ws   = fs.createWriteStream(dest);
            const p    = new Promise((res, rej) => {
              ws.on('finish', () => { sqlFile = dest; res(); });
              ws.on('error', rej);
            });
            pending.push(p);
            entry.pipe(ws);
          } else {
            const dest = path.join(projectRoot, entryPath);
            const dir  = path.dirname(dest);
            try { fs.mkdirSync(dir, { recursive: true }); } catch (_) {}
            const ws = fs.createWriteStream(dest);
            const p  = new Promise((res) => {
              ws.on('finish', () => { fileCount++; res(); });
              ws.on('error', () => res()); // не прерываем при ошибке одного файла
            });
            pending.push(p);
            entry.pipe(ws);
          }
        })
        .on('close', () => {
          if (!hasError) Promise.all(pending).then(resolve).catch(reject);
        })
        .on('error', (err) => { hasError = true; reject(err); });
    });

    if (!sqlFile) throw new Error('SQL файл дампа не найден в архиве');

    if (fileCount > 0) {
      console.log(`   ✅ Файлы проекта восстановлены: ${fileCount} файлов`);
    }
    console.log(`   ✅ SQL дамп: ${path.basename(sqlFile)}`);

    const psqlPath       = findPgBinary('psql');
    const restoreCommand = `"${psqlPath}" -h "${config.host}" -p ${config.port} -U "${config.user}" -d "${config.database}" -f "${sqlFile}"`;
    const env            = { ...process.env, PGPASSWORD: config.password };

    console.log('🔄 Восстановление базы данных...');
    await ensureDatabase(config);
    await execAsync(restoreCommand, { env, maxBuffer: 50 * 1024 * 1024 });

    console.log('🧹 Очистка...');
    if (fs.existsSync(extractDir)) {
      fs.rmSync(extractDir, { recursive: true, force: true });
    }

    return { success: true, fileCount, isFullBackup: fileCount > 0 };
  } catch (error) {
    if (fs.existsSync(extractDir)) {
      try { fs.rmSync(extractDir, { recursive: true, force: true }); } catch (_) {}
    }
    throw error;
  }
}

async function main() {
  try {
    console.log('\n🔄 Восстановление базы данных из бэкапа\n');

    // Fetch backups list
    console.log('📋 Загрузка списка бэкапов...');
    const backups = await listBackups();

    if (backups.length === 0) {
      console.log('\n❌ Нет доступных бэкапов для восстановления.');
      rl.close();
      return;
    }

    console.log('\n📦 Доступные бэкапы:\n');
    backups.forEach((backup, index) => {
      console.log(`  ${index + 1}. ${backup.name}`);
      console.log(`     📁 Файл: ${backup.file}`);
      console.log(`     📊 Размер: ${formatSize(backup.size)}`);
      console.log(`     📅 Создан: ${formatDate(backup.created)}`);
      console.log('');
    });

    // Ask user to select backup
    let backupIndex = null;
    if (process.argv[2]) {
      backupIndex = parseInt(process.argv[2]) - 1;
      if (isNaN(backupIndex) || backupIndex < 0 || backupIndex >= backups.length) {
        console.log('\n❌ Неверный номер бэкапа. Используйте интерактивный режим.');
        backupIndex = null;
      }
    }
    
    if (backupIndex === null) {
      const answer = await askQuestion('\n❓ Выберите номер бэкапа для восстановления (или Ctrl+C для отмены): ');
      backupIndex = parseInt(answer) - 1;

      if (isNaN(backupIndex) || backupIndex < 0 || backupIndex >= backups.length) {
        console.log('\n❌ Неверный выбор.');
        rl.close();
        return;
      }
    }

    const index = backupIndex;

    const selectedBackup = backups[index];

    // Check if auto-confirm flag is set
    const autoConfirm = process.argv.includes('--confirm') || process.argv[3] === 'yes';

    // Confirm restoration
    let confirm = autoConfirm ? 'yes' : null;
    if (!confirm) {
      confirm = await askQuestion(
        `\n⚠️  ВНИМАНИЕ! Это перезапишет текущую базу данных.\n` +
        `   Вы уверены, что хотите восстановить бэкап "${selectedBackup.name}"? (yes/no): `
      );
    } else {
      console.log(`\n✅ Автоматическое подтверждение активировано для бэкапа "${selectedBackup.name}"`);
    }

    if (confirm.toLowerCase() !== 'yes') {
      console.log('\n❌ Восстановление отменено.');
      rl.close();
      return;
    }

    console.log('\n🔄 Восстановление базы данных...');

    try {
      let result;
      
      if (USE_DIRECT_MODE) {
        // Прямое восстановление без API
        result = await restoreDirect(selectedBackup.file);
      } else {
        // Восстановление через API
        result = await makeRequest('POST', '/api/backup/restore', {
          file: selectedBackup.file
        });
      }

      if (result.success) {
        console.log('\n✅ База данных успешно восстановлена!');
        console.log(`   Бэкап: ${selectedBackup.name}`);
        if (result.isFullBackup) {
          console.log(`   Файлов проекта восстановлено: ${result.fileCount}`);
        }
        console.log('\n💡 Перезапустите сервер для применения изменений.');
      } else {
        console.log('\n❌ Ошибка при восстановлении:', result.message);
      }
    } catch (error) {
      console.error('\n❌ Ошибка при восстановлении:', error.message || error);
      if (error.body && error.body.error) {
        console.error('Подробно:', error.body.error);
      }
      if (error.body && error.body.details) {
        console.error('Детали:', error.body.details);
      }
    }

    rl.close();
  } catch (error) {
    console.error('\n❌ Неожиданная ошибка:', error.message || error);
    rl.close();
  }
}

main();
