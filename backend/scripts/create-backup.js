require('dotenv').config({ path: require('path').join(__dirname, '..', 'env') });
const http = require('http');

const API_URL = process.env.API_URL;

if (!API_URL) {
  console.error('❌ Ошибка: API_URL не найден в файле backend/env');
  console.error('   Добавьте в backend/env: API_URL=http://localhost:3001');
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

async function main() {
  try {
    const backupName = process.argv[2];
    const data = backupName ? { name: backupName } : {};

    console.log('🔄 Создание бэкапа...');
    const result = await makeRequest('POST', '/api/backup/create', data);

    if (result.success) {
      console.log('\n✅ Бэкап успешно создан!');
      console.log(`   📁 Имя: ${result.backup.name}`);
      console.log(`   📄 Файл: ${result.backup.file}`);
      console.log(`   📊 Размер: ${(result.backup.size / 1024).toFixed(2)} KB`);
      console.log(`   📅 Создан: ${new Date(result.backup.created).toLocaleString('ru-RU')}`);
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
