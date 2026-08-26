#!/usr/bin/env node

/**
 * Smoke test для модуля Contractors
 * Проверяет что критические эндпоинты возвращают 200 OK
 * Используется перед мёржем для валидации рефакторинга
 */

const http = require('http');

const API_BASE_URL = process.env.API_URL || 'http://localhost:5000';
const ENDPOINTS = [
  { method: 'GET', path: '/api/contractors', name: 'Get all contractors' },
  { method: 'GET', path: '/api/contractors/1', name: 'Get contractor by ID' },
  { method: 'POST', path: '/api/contractors/bulk-update', name: 'Bulk update contractors', body: { ids: [], updates: {} } },
  { method: 'POST', path: '/api/contractors/bulk-delete', name: 'Bulk delete contractors', body: { ids: [] } },
];

// Test if server is running
async function checkServerStatus() {
  return new Promise((resolve) => {
    const url = new URL(API_BASE_URL);
    const options = {
      method: 'GET',
      hostname: url.hostname,
      port: url.port || 5000,
      path: '/health',
      timeout: 2000,
    };

    const req = http.request(options, (res) => {
      resolve(true);
    });

    req.on('error', () => {
      resolve(false);
    });

    req.on('timeout', () => {
      req.destroy();
      resolve(false);
    });

    req.end();
  });
}

async function testEndpoint(endpoint) {
  return new Promise((resolve) => {
    const url = new URL(API_BASE_URL + endpoint.path);
    const options = {
      method: endpoint.method,
      hostname: url.hostname,
      port: url.port || 5000,
      path: url.pathname + url.search,
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': '1',
      },
      timeout: 5000,
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        const success = res.statusCode >= 200 && res.statusCode < 300;
        resolve({
          endpoint: endpoint.name,
          path: endpoint.path,
          statusCode: res.statusCode,
          success,
          error: success ? null : `Expected 2xx, got ${res.statusCode}`
        });
      });
    });

    req.on('error', (err) => {
      resolve({
        endpoint: endpoint.name,
        path: endpoint.path,
        statusCode: 0,
        success: false,
        error: err.message
      });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({
        endpoint: endpoint.name,
        path: endpoint.path,
        statusCode: 0,
        success: false,
        error: 'Request timeout'
      });
    });

    if (endpoint.body) {
      req.write(JSON.stringify(endpoint.body));
    }

    req.end();
  });
}

async function runTests() {
  console.log(`\n🧪 Contractors Module Smoke Test`);
  console.log(`📍 API: ${API_BASE_URL}\n`);

  // Check if server is running
  console.log('Checking server status...');
  const serverRunning = await checkServerStatus();
  
  if (!serverRunning) {
    console.log(`⚠️  Server not responding at ${API_BASE_URL}`);
    console.log(`\n❌ Cannot run smoke tests - server is not running`);
    console.log(`\nTo start the server, run:`);
    console.log(`  cd backend && npm run dev`);
    console.log(`  or`);
    console.log(`  cd backend && node index.js\n`);
    process.exit(1);
  }

  console.log('✅ Server is running\n');

  const results = [];
  for (const endpoint of ENDPOINTS) {
    process.stdout.write(`Testing: ${endpoint.name}... `);
    const result = await testEndpoint(endpoint);
    results.push(result);
    
    if (result.success) {
      console.log(`✅ ${result.statusCode} OK`);
    } else {
      console.log(`❌ ${result.error}`);
    }
  }

  console.log('\n' + '='.repeat(60));
  const passed = results.filter(r => r.success).length;
  const total = results.length;
  
  if (passed === total) {
    console.log(`✅ All tests passed! (${passed}/${total})\n`);
    process.exit(0);
  } else {
    console.log(`❌ Some tests failed! (${passed}/${total})\n`);
    results.forEach(r => {
      if (!r.success) {
        console.log(`  - ${r.path}: ${r.error}`);
      }
    });
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Test runner error:', err);
  process.exit(1);
});
