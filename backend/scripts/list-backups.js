// List backups script
require('dotenv').config({ path: require('path').join(__dirname, '..', 'env') });
const http = require('http');

const API_URL = process.env.API_URL;

if (!API_URL) {
  console.error('❌ Ошибка: API_URL не найден в файле env');
  console.error('   Добавьте в env: API_URL=http://localhost:3001');
  process.exit(1);
}

function makeRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, API_URL);
    const options = {
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
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

function formatSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}

function formatDate(dateString) {
  return new Date(dateString).toLocaleString('ru-RU');
}

async function main() {
  try {
    console.log('📋 Загрузка списка бэкапов...\n');
    const backups = await makeRequest('GET', '/api/backup/list');

    if (backups.length === 0) {
      console.log('❌ Нет доступных бэкапов.\n');
      return;
    }

    console.log(`📦 Доступные бэкапы (${backups.length}):\n`);
    backups.forEach((backup, index) => {
      console.log(`  ${index + 1}. ${backup.name}`);
      console.log(`     📁 Файл: ${backup.file}`);
      console.log(`     📊 Размер: ${formatSize(backup.size)}`);
      console.log(`     📅 Создан: ${formatDate(backup.created)}`);
      console.log('');
    });
  } catch (error) {
    console.error('\n❌ Ошибка при получении списка бэкапов:', error.message || error);
    process.exit(1);
  }
}

main();
