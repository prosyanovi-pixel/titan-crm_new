// Download backup script
const readline = require('readline');
const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: 'env' });

const API_URL = process.env.API_URL;

if (!API_URL) {
  console.error('❌ Ошибка: API_URL не найден в файле env');
  console.error('   Добавьте в env: API_URL=http://localhost:3001');
  process.exit(1);
}

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

async function listBackups() {
  try {
    const backups = await makeRequest('GET', '/api/backup/list');
    return backups;
  } catch (error) {
    console.error('Error fetching backups:', error.message);
    return [];
  }
}

function downloadFile(url, outputPath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(outputPath);
    
    const protocol = url.startsWith('https') ? https : http;
    
    protocol.get(url, (response) => {
      response.pipe(file);
      
      file.on('finish', () => {
        file.close();
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(outputPath, () => {}); // Delete the file if error
      reject(err);
    });
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
  console.log('\n📥 Скачивание бэкапа\n');

  // Fetch backups list
  console.log('📋 Загрузка списка бэкапов...');
  const backups = await listBackups();

  if (backups.length === 0) {
    console.log('\n❌ Нет доступных бэкапов для скачивания.');
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
  rl.question('\n❓ Выберите номер бэкапа для скачивания (или Ctrl+C для отмены): ', (answer) => {
    const index = parseInt(answer) - 1;

    if (isNaN(index) || index < 0 || index >= backups.length) {
      console.log('\n❌ Неверный выбор.');
      rl.close();
      return;
    }

    const selectedBackup = backups[index];
    const downloadPath = path.join(process.cwd(), selectedBackup.file);

    console.log(`\n📥 Скачивание "${selectedBackup.file}"...`);

    downloadFile(`${API_URL}/api/backup/download/${selectedBackup.file}`, downloadPath)
      .then(() => {
        console.log(`\n✅ Бэкап успешно скачан!`);
        console.log(`   📁 Путь: ${downloadPath}`);
        console.log(`   📊 Размер: ${formatSize(fs.statSync(downloadPath).size)}`);
        rl.close();
      })
      .catch((error) => {
        console.error('\n❌ Ошибка при скачивании:', error.message);
        rl.close();
      });
  });
}

main();
