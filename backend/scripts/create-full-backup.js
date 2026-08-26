/**
 * Полный бэкап проекта: дамп базы данных + все файлы проекта
 * (включая dot-файлы: .env, .github, .vscode и т.д.)
 * Исключает: .git, node_modules, backend/node_modules, frontend/node_modules,
 *            package-lock.json, backend/package-lock.json, frontend/package-lock.json,
 *            backend/backups, мусор macOS.
 *
 * Использование:
 *   node scripts/create-full-backup.js [имя-бэкапа]
 *
 * Примеры:
 *   node scripts/create-full-backup.js
 *   node scripts/create-full-backup.js my-backup
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', 'env') });
const http = require('http');

const API_URL = process.env.API_URL;

if (!API_URL) {
  console.error('❌ Ошибка: API_URL не найден в файле backend/env');
  console.error('   Добавьте в backend/env: API_URL=http://localhost:3001');
  process.exit(1);
}

function makeRequest(method, urlPath, data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(urlPath, API_URL);
    const body = data ? JSON.stringify(data) : null;
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(body ? { 'Content-Length': Buffer.byteLength(body) } : {}),
      },
    };

    const req = http.request(url, options, (res) => {
      let raw = '';
      res.on('data', (chunk) => (raw += chunk));
      res.on('end', () => {
        try {
          const parsed = JSON.parse(raw);
          if (res.statusCode >= 400) {
            const msg = parsed?.message || parsed?.error || JSON.stringify(parsed);
            const err = new Error(`HTTP ${res.statusCode}: ${msg}`);
            err.status = res.statusCode;
            err.body = parsed;
            reject(err);
          } else {
            resolve(parsed);
          }
        } catch (_) {
          if (res.statusCode >= 400) {
            reject(new Error(`HTTP ${res.statusCode}: ${raw || 'Пустой ответ сервера'}`));
          } else {
            resolve(raw);
          }
        }
      });
    });

    // Увеличиваем таймаут для долгой операции бэкапа (10 минут)
    req.setTimeout(600000);

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Превышено время ожидания ответа от сервера (Timeout). Возможно, бэкап всё еще создается в фоне.'));
    });

    req.on('error', (err) => {
      if (err.code === 'ECONNREFUSED') {
        reject(
          new Error(
            `Не удалось подключиться к API (${API_URL}). Запустите backend: npm run dev`
          )
        );
        return;
      }
      reject(err);
    });

    if (body) req.write(body);
    req.end();
  });
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

async function main() {
  const args = process.argv.slice(2);
  const backupName = args.find((a) => !a.startsWith('--')) || null;

  const payload = {};
  if (backupName) payload.name = backupName;

  console.log('🔄 Создание полного бэкапа проекта (БД + файлы, включая dot-файлы)...');

  try {
    const result = await makeRequest('POST', '/api/backup/full', payload);

    if (result.success) {
      console.log('\n✅ Полный бэкап успешно создан!');
      console.log(`   📁 Имя:     ${result.backup.name}`);
      console.log(`   📄 Файл:    ${result.backup.file}`);
      console.log(`   📊 Размер:  ${formatBytes(result.backup.size)}`);
      console.log(`   📅 Создан:  ${new Date(result.backup.created).toLocaleString('ru-RU')}`);
    } else {
      console.error('\n❌ Ошибка при создании бэкапа:', result.message);
      process.exit(1);
    }
  } catch (error) {
    console.error('\n❌ Ошибка при создании бэкапа:', error.message || error);
    process.exit(1);
  }
}

main();
