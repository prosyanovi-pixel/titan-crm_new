
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Manually parse the env file
const envPath = path.resolve(__dirname, 'env');
const envContent = fs.readFileSync(envPath, 'utf8');
const lines = envContent.split('\n');
const envVars = {};
lines.forEach(line => {
  if (line.trim() && !line.startsWith('#')) {
    const [key, value] = line.split('=');
    if (key && value) {
      envVars[key.trim()] = value.trim().replace(/^"(.*)"$/, '$1').replace(/^'(.*)'$/, '$1');
    }
  }
});

// Проверяем наличие обязательных переменных окружения
const requiredDbVars = ['DB_USER', 'DB_HOST', 'DB_NAME', 'DB_PASSWORD', 'DB_PORT'];
const missingDbVars = requiredDbVars.filter(varName => !envVars[varName]);

if (missingDbVars.length > 0) {
  console.error('❌ Ошибка: Отсутствуют обязательные переменные окружения в файле env:');
  missingDbVars.forEach(varName => console.error(`   - ${varName}`));
  console.error('   Проверьте файл env в директории backend');
  process.exit(1);
}

const config = {
  user: envVars.DB_USER,
  host: envVars.DB_HOST,
  database: envVars.DB_NAME,
  password: envVars.DB_PASSWORD,
  port: parseInt(envVars.DB_PORT, 10),
};

const pool = new Pool(config);

// Утилита для преобразования ключей из snake_case (БД) в camelCase (JS)
const toCamelCase = (rows) => {
  if (!rows || !Array.isArray(rows)) return rows;
  return rows.map(row => {
    const newRow = {};
    for (const key in row) {
      const camelKey = key.replace(/([-_][a-z])/ig, ($1) => {
        return $1.toUpperCase()
          .replace('-', '')
          .replace('_', '');
      });
      newRow[camelKey] = row[key];
    }
    return newRow;
  });
};

module.exports = {
  query: async (text, params) => {
    const start = Date.now();
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    // console.log('executed query', { text, duration, rows: res.rowCount });
    return { ...res, rows: toCamelCase(res.rows) };
  },
  getClient: async () => {
    return await pool.connect();
  },
  pool,
  end: async () => {
    return await pool.end();
  }
};
