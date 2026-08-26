// Direct restore script - работает без запущенного backend сервера
//
// Использование:
//   node scripts/restore-direct.js <номер>  --confirm   — из папки backend/backups/
//   node scripts/restore-direct.js <путь.zip> --confirm  — портативный режим (новый ПК)
//
// В портативном режиме backend/env автоматически извлекается из архива,
// поэтому никаких ручных настроек перед запуском не требуется.

const fs = require('fs');
const path = require('path');
const { exec, execSync } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);
const unzipper = require('unzipper');
const os = require('os');

const ENV_PATH   = path.join(__dirname, '..', 'env');
const BACKUP_DIR = path.join(__dirname, '../backups');

// Best-effort: загружаем env если уже есть на диске
require('dotenv').config({ path: ENV_PATH });

/**
 * Автоопределение пути к PostgreSQL бинарнику
 */
function findPgBinary(name) {
  const envKey = name === 'pg_dump' ? 'PG_DUMP_PATH' : 'PSQL_PATH';
  const envVal = (process.env[envKey] || '').trim();
  if (envVal) {
    return envVal;
  }

  const platform = os.platform();

  // Проверяем системный PATH
  try {
    const whichCmd = platform === 'win32' ? `where ${name}` : `which ${name}`;
    const found = execSync(whichCmd, { stdio: ['ignore', 'pipe', 'ignore'] })
      .toString().trim().split(/\r?\n/)[0].trim();
    if (found) {
      console.log(`✅ Найден ${name} в PATH: ${found}`);
      return found;
    }
  } catch (_) {
    // не найдено в PATH
  }

  // Стандартные пути установки по ОС
  const versions = ['18', '17', '16', '15', '14', '13', '12'];
  const candidates = {
    win32: [
      ...versions.flatMap(v => [
        `C:\\Program Files\\PostgreSQL\\${v}\\bin\\${name}.exe`,
        `C:\\Program Files (x86)\\PostgreSQL\\${v}\\bin\\${name}.exe`,
      ]),
    ],
    darwin: [
      ...versions.flatMap(v => [
        `/Applications/Postgres.app/Contents/Versions/${v}/bin/${name}`,
        `/Library/PostgreSQL/${v}/bin/${name}`,
        `/opt/local/lib/postgresql${v}/bin/${name}`,
      ]),
      `/opt/homebrew/bin/${name}`,
      `/usr/local/bin/${name}`,
      `/opt/local/bin/${name}`,
      `/usr/bin/${name}`,
    ],
    linux: [
      `/usr/bin/${name}`,
      `/usr/local/bin/${name}`,
    ],
  };

  const list = candidates[platform] || candidates.linux;
  for (const p of list) {
    if (fs.existsSync(p)) {
      console.log(`✅ Найден ${name}: ${p}`);
      return p;
    }
  }

  // Последний вариант - просто имя
  console.log(`⚠️  ${name} не найден, используем имя по умолчанию`);
  return name;
}

/**
 * Получение конфигурации БД
 */
function getDbConfig() {
  const config = {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD
  };
  
  const requiredFields = ['host', 'port', 'database', 'user'];
  const missingFields = requiredFields.filter(field => !config[field]);
  
  if (missingFields.length > 0) {
    throw new Error(`❌ Отсутствуют переменные окружения: ${missingFields.join(', ')}`);
  }
  
  return config;
}

/**
 * Список доступных бэкапов
 */
function listBackups() {
  if (!fs.existsSync(BACKUP_DIR)) {
    return [];
  }

  const files = fs.readdirSync(BACKUP_DIR)
    .filter(f => f.endsWith('.zip'))
    .map(f => {
      const filePath = path.join(BACKUP_DIR, f);
      const stats = fs.statSync(filePath);
      return {
        name: f.replace('.zip', ''),
        file: f,
        size: stats.size,
        created: stats.mtime
      };
    })
    .sort((a, b) => b.created - a.created);
  
  return files;
}

/**
 * Форматирование размера файла
 */
function formatSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}

/**
 * Форматирование даты
 */
function formatDate(date) {
  return date.toLocaleString('ru-RU');
}

/**
 * Извлекает SQL-дамп И файлы проекта из ZIP-архива.
 * Файл в корне архива с расширением .sql считается дампом БД;
 * все остальные файлы восстанавливаются в targetRoot.
 */
async function extractBackup(zipPath, extractDir, targetRoot) {
  console.log('📦 Распаковка архива...');
  console.log(`   Источник: ${zipPath}`);
  console.log(`   SQL дамп → ${extractDir}`);
  console.log(`   Файлы проекта → ${targetRoot}`);

  if (fs.existsSync(extractDir)) {
    console.log('   Очистка существующей временной директории...');
    fs.rmSync(extractDir, { recursive: true, force: true });
  }
  fs.mkdirSync(extractDir, { recursive: true });
  console.log('   ✅ Временная директория создана');

  let sqlFile   = null;
  let fileCount = 0;
  const pending = [];

  await new Promise((resolve, reject) => {
    let hasError = false;
    const readStream = fs.createReadStream(zipPath);

    readStream.on('error', (err) => {
      console.error('❌ Ошибка чтения архива:', err.message);
      hasError = true;
      reject(err);
    });

    readStream
      .pipe(unzipper.Parse())
      .on('entry', (entry) => {
        if (hasError) { entry.autodrain(); return; }
        const { path: entryPath, type } = entry;
        if (type !== 'File') { entry.autodrain(); return; }

        // Файл в корне с .sql → дамп БД
        const isRootSql = !entryPath.includes('/') && entryPath.endsWith('.sql');

        if (isRootSql) {
          const dest = path.join(extractDir, path.basename(entryPath));
          console.log(`   📄 Найден SQL дамп: ${entryPath}`);
          const ws = fs.createWriteStream(dest);
          const p  = new Promise((res, rej) => {
            ws.on('finish', () => { sqlFile = dest; res(); });
            ws.on('error', (e) => { hasError = true; rej(e); });
          });
          pending.push(p);
          entry.pipe(ws);
        } else {
          // Файл проекта — воспроизводим структуру
          const dest = path.join(targetRoot, entryPath);
          const dir  = path.dirname(dest);
          try { fs.mkdirSync(dir, { recursive: true }); } catch (_) {}
          const ws = fs.createWriteStream(dest);
          const p  = new Promise((res) => {
            ws.on('finish', () => { fileCount++; res(); });
            ws.on('error', (e) => {
              console.error(`   ⚠️  Пропущен файл ${entryPath}:`, e.message);
              res();
            });
          });
          pending.push(p);
          entry.pipe(ws);
        }
      })
      .on('close', () => {
        if (!hasError) Promise.all(pending).then(resolve).catch(reject);
      })
      .on('error', (err) => {
        console.error('❌ Ошибка распаковки:', err.message);
        hasError = true;
        reject(err);
      });
  });

  if (!sqlFile) throw new Error('SQL файл дампа не найден в архиве');
  if (fileCount > 0) {
    console.log(`   ✅ Файлов проекта восстановлено: ${fileCount}`);
  }
  console.log(`   📌 SQL дамп: ${path.basename(sqlFile)}`);
  return { sqlFile, fileCount };
}

/**
 * Восстановление базы данных из SQL файла
 */
async function restoreDatabase(sqlFile, config) {
  console.log('🔄 Восстановление базы данных...');
  console.log(`   Файл: ${sqlFile}`);
  console.log(`   База: ${config.database}`);
  console.log(`   Хост: ${config.host}:${config.port}`);
  console.log(`   Пользователь: ${config.user}`);
  
  // Проверяем существование SQL файла
  if (!fs.existsSync(sqlFile)) {
    throw new Error(`❌ SQL файл не найден: ${sqlFile}`);
  }
  
  const fileSize = fs.statSync(sqlFile).size;
  console.log(`   Размер: ${formatSize(fileSize)}`);
  
  const psqlPath = findPgBinary('psql');
  const env = { ...process.env, PGPASSWORD: config.password };

  // Создаём БД если не существует (для портативного восстановления)
  try {
    await execAsync(
      `"${psqlPath}" -h "${config.host}" -p ${config.port} -U "${config.user}" -d "${config.database}" -c "SELECT 1" --no-psqlrc -q`,
      { env }
    );
  } catch (_) {
    console.log(`   ℹ️  База "${config.database}" не найдена, создаём...`);
    await execAsync(
      `"${psqlPath}" -h "${config.host}" -p ${config.port} -U "${config.user}" -d postgres -c "CREATE DATABASE \\"${config.database}\\" ENCODING 'UTF8'"`,
      { env }
    );
    console.log(`   ✅ База "${config.database}" создана`);
  }
  
  // Формируем команду восстановления
  const restoreCommand = `"${psqlPath}" -h "${config.host}" -p ${config.port} -U "${config.user}" -d "${config.database}" -f "${sqlFile}"`;
  
  console.log('   Выполнение команды восстановления...');
  console.log(`   ${psqlPath} -h ${config.host} -p ${config.port} -U ${config.user} -d ${config.database} -f <sql-file>`);
  
  try {
    const { stdout, stderr } = await execAsync(restoreCommand, { 
      env,
      maxBuffer: 50 * 1024 * 1024 // 50 МБ буфер для больших баз
    });
    
    if (stdout) {
      console.log('   📝 Вывод psql:', stdout);
    }
    if (stderr) {
      // psql выводит некоторые сообщения в stderr, но это не всегда ошибки
      console.log('   ⚠️  Предупреждения:', stderr);
    }
    
    console.log('   ✅ Восстановление базы данных завершено');
    return true;
  } catch (error) {
    console.error('❌ Ошибка восстановления:', error.message);
    if (error.stdout) {
      console.log('   Вывод:', error.stdout);
    }
    if (error.stderr) {
      console.error('   Ошибки:', error.stderr);
    }
    throw error;
  }
}

/**
 * Извлекает один файл из ZIP по внутреннему пути entryName.
 * Используется для bootstrap backend/env на новом компьютере.
 */
async function extractFileFromZip(zipPath, entryName, destPath) {
  return new Promise((resolve, reject) => {
    const readStream = fs.createReadStream(zipPath);
    readStream.on('error', reject);
    let found = false;
    readStream
      .pipe(unzipper.Parse())
      .on('entry', (entry) => {
        if (entry.path === entryName) {
          found = true;
          fs.mkdirSync(path.dirname(destPath), { recursive: true });
          const ws = fs.createWriteStream(destPath);
          ws.on('finish', resolve);
          ws.on('error', reject);
          entry.pipe(ws);
        } else {
          entry.autodrain();
        }
      })
      .on('close', () => {
        if (!found) reject(new Error(`"${entryName}" не найден в архиве`));
      })
      .on('error', reject);
  });
}

/**
 * Основная функция
 */
async function main() {
  console.log('\n' + '='.repeat(60));
  console.log('🔄 Прямое восстановление базы данных из бэкапа');
  console.log('='.repeat(60) + '\n');

  const args        = process.argv.slice(2);
  const autoConfirm = args.includes('--confirm');
  const firstArg    = args.find(a => !a.startsWith('--')) || '';

  // Определяем режим: портативный (путь к zip) или локальный (номер)
  const isPortable = firstArg.endsWith('.zip') || firstArg.includes(path.sep) || firstArg.includes('/');

  try {
    let backupPath;
    let backupName;

    if (isPortable) {
      // ── ПОРТАТИВНЫЙ РЕЖИМ ─────────────────────────────────────────
      // Используется когда архив принесён на новый компьютер:
      //   node scripts/restore-direct.js /path/to/full-backup-2026.zip --confirm
      backupPath = path.resolve(firstArg);
      if (!fs.existsSync(backupPath)) {
        console.error(`❌ Файл не найден: ${backupPath}`);
        process.exit(1);
      }
      backupName = path.basename(backupPath, '.zip');

      // Шаг 0: вытащить backend/env из архива, если его нет на диске
      if (!fs.existsSync(ENV_PATH)) {
        console.log('⚙️  backend/env не найден — извлекаем из архива...');
        try {
          await extractFileFromZip(backupPath, 'backend/env', ENV_PATH);
          // Перезагружаем dotenv с результатом
          require('dotenv').config({ path: ENV_PATH, override: true });
          console.log('   ✅ backend/env восстановлен и загружен\n');
        } catch (e) {
          console.error('❌ Не удалось извлечь backend/env из архива:', e.message);
          console.error('   Создайте файл backend/env вручную по образцу backend/env.example');
          process.exit(1);
        }
      }
    } else {
      // ── ЛОКАЛЬНЫЙ РЕЖИМ ───────────────────────────────────────────
      // node scripts/restore-direct.js 1 --confirm
      console.log('📋 Поиск доступных бэкапов...');
      const backups = listBackups();

      if (backups.length === 0) {
        console.log('❌ Нет доступных бэкапов в директории:', BACKUP_DIR);
        process.exit(1);
      }
      console.log(`   ✅ Найдено бэкапов: ${backups.length}\n`);

      console.log('📦 Доступные бэкапы:\n');
      backups.forEach((backup, index) => {
        console.log(`  ${index + 1}. ${backup.name}`);
        console.log(`     📁 Файл: ${backup.file}`);
        console.log(`     📊 Размер: ${formatSize(backup.size)}`);
        console.log(`     📅 Создан: ${formatDate(backup.created)}`);
        console.log('');
      });

      let backupIndex = parseInt(firstArg) - 1;
      if (!firstArg || isNaN(backupIndex) || backupIndex < 0 || backupIndex >= backups.length) {
        console.log('❌ Укажите номер бэкапа для восстановления');
        console.log(`   Пример: node scripts/restore-direct.js 1 --confirm`);
        console.log(`   Или укажите путь к zip: node scripts/restore-direct.js path/to/backup.zip --confirm`);
        process.exit(1);
      }

      backupPath = path.join(BACKUP_DIR, backups[backupIndex].file);
      backupName = backups[backupIndex].name;
    }

    console.log('='.repeat(60));
    console.log(`📌 Выбран бэкап: ${backupName}`);
    console.log('='.repeat(60) + '\n');

    if (!autoConfirm) {
      console.log('⚠️  ВНИМАНИЕ! Это действие перезапишет текущую базу данных и файлы проекта!');
      console.log('   Для подтверждения добавьте флаг --confirm');
      console.log(`   Пример: node scripts/restore-direct.js "${firstArg}" --confirm\n`);
      process.exit(1);
    }
    console.log('✅ Восстановление подтверждено\n');

    // 1. Загружаем конфигурацию БД
    console.log('⚙️  Загрузка конфигурации...');
    const config = getDbConfig();
    console.log('   ✅ Конфигурация загружена\n');

    // 2. Извлекаем SQL дамп и файлы проекта
    const extractDir  = path.join(BACKUP_DIR, `temp-restore-${Date.now()}`);
    // В портативном режиме backups/ может не существовать, используем системный temp
    const safeExtractDir = fs.existsSync(BACKUP_DIR)
      ? extractDir
      : path.join(os.tmpdir(), `titan-restore-${Date.now()}`);
    const projectRoot = path.join(__dirname, '..', '..');

    let sqlFile;
    let fileCount = 0;
    try {
      ({ sqlFile, fileCount } = await extractBackup(backupPath, safeExtractDir, projectRoot));
      console.log();
    } catch (error) {
      console.error('❌ Ошибка при извлечении архива:', error.message);
      if (fs.existsSync(safeExtractDir)) fs.rmSync(safeExtractDir, { recursive: true, force: true });
      process.exit(1);
    }

    // 3. Восстанавливаем базу данных
    try {
      await restoreDatabase(sqlFile, config);
      console.log();
    } catch (error) {
      console.error('❌ Ошибка при восстановлении базы данных');
      if (fs.existsSync(safeExtractDir)) fs.rmSync(safeExtractDir, { recursive: true, force: true });
      process.exit(1);
    }

    // 4. Очищаем временные файлы
    console.log('🧹 Очистка временных файлов...');
    if (fs.existsSync(safeExtractDir)) {
      fs.rmSync(safeExtractDir, { recursive: true, force: true });
      console.log('   ✅ Временные файлы удалены\n');
    }

    // 5. Готово!
    console.log('='.repeat(60));
    console.log(fileCount > 0 ? '✅ Полный бэкап успешно восстановлен!' : '✅ База данных успешно восстановлена!');
    console.log('='.repeat(60));
    console.log(`   Бэкап: ${backupName}`);
    if (fileCount > 0) {
      console.log(`   Файлов проекта восстановлено: ${fileCount}`);
    }
    console.log('\n💡 Рекомендация: Перезапустите backend сервер для применения изменений');
    console.log('   Команда: npm run dev\n');

  } catch (error) {
    console.error('\n❌ Критическая ошибка:', error.message);
    console.error('\n🔍 Возможные причины:');
    console.error('   • PostgreSQL не установлен или не найден');
    console.error('   • Неверные параметры подключения в backend/env');
    console.error('   • База данных недоступна');
    console.error('   • Недостаточно прав доступа\n');
    process.exit(1);
  }
}

// Запускаем скрипт
main();
