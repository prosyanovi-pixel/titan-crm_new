// Тест интеграции frontend <-> backend
const API_URL = 'http://localhost:5001';

console.log('🧪 Тестирование интеграции Frontend <-> Backend\n');

// Тест 1: Health check
async function testHealth() {
  console.log('📋 Тест 1: Health endpoint');
  try {
    const res = await fetch(`${API_URL}/health`);
    const data = await res.json();
    console.log('✅ Health:', data.status);
    return true;
  } catch (e) {
    console.log('❌ Health:', e.message);
    return false;
  }
}

// Тест 2: API Health с БД
async function testApiHealth() {
  console.log('\n📋 Тест 2: API Health (с БД)');
  try {
    const res = await fetch(`${API_URL}/api/health`);
    const data = await res.json();
    console.log('✅ API Health:', data.status, '| Database:', data.database);
    return true;
  } catch (e) {
    console.log('❌ API Health:', e.message);
    return false;
  }
}

// Тест 3: Login
async function testLogin() {
  console.log('\n📋 Тест 3: Login (аутентификация)');
  try {
    const res = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: 'мария.менеджер@titan.com',
        password: 'password123'
      })
    });
    const data = await res.json();
    
    if (data.token) {
      console.log('✅ Login: Успешно');
      console.log('   Token:', data.token.substring(0, 50) + '...');
      console.log('   User:', data.user.name);
      console.log('   Role:', data.user.role);
      return { success: true, token: data.token, user: data.user };
    } else {
      console.log('❌ Login:', data.error);
      return { success: false };
    }
  } catch (e) {
    console.log('❌ Login:', e.message);
    return { success: false };
  }
}

// Тест 4: API запрос с токеном
async function testAuthorizedApi(token) {
  console.log('\n📋 Тест 4: API запрос с токеном (Contractors)');
  try {
    const res = await fetch(`${API_URL}/api/contractors`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'x-user-id': '1',
        'Content-Type': 'application/json'
      }
    });
    const data = await res.json();
    
    if (Array.isArray(data)) {
      console.log('✅ Contractors: Получено', data.length, 'записей');
      if (data.length > 0) {
        console.log('   Первый:', data[0].name);
      }
      return true;
    } else {
      console.log('❌ Contractors:', data.error || 'Неверный формат ответа');
      return false;
    }
  } catch (e) {
    console.log('❌ Contractors:', e.message);
    return false;
  }
}

// Тест 5: Неправильный пароль
async function testWrongPassword() {
  console.log('\n📋 Тест 5: Неправильный пароль');
  try {
    const res = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: 'мария.менеджер@titan.com',
        password: 'wrongpassword'
      })
    });
    const data = await res.json();
    
    if (res.status === 401) {
      console.log('✅ Правильно отклонён (401):', data.error);
      return true;
    } else {
      console.log('❌ Ошибка:', data.error);
      return false;
    }
  } catch (e) {
    console.log('❌ Wrong Password:', e.message);
    return false;
  }
}

// Тест 6: Проверка frontend конфигурации
async function testFrontendConfig() {
  console.log('\n📋 Тест 6: Проверка конфигурации Frontend');
  const fs = require('fs');
  const path = require('path');
  
  try {
    const envPath = path.join(__dirname, 'frontend', '.env');
    const envContent = fs.readFileSync(envPath, 'utf8');
    const apiUrl = envContent.match(/VITE_API_URL=(.+)/)?.[1];
    
    if (apiUrl) {
      console.log('✅ Frontend .env найден');
      console.log('   VITE_API_URL:', apiUrl);
      
      // Проверяем что API URL совпадает
      if (apiUrl.includes('localhost:5001')) {
        console.log('✅ API URL настроен правильно');
        return true;
      } else {
        console.log('⚠️ API URL может не совпадать с backend');
        return false;
      }
    } else {
      console.log('❌ VITE_API_URL не найден');
      return false;
    }
  } catch (e) {
    console.log('❌ Frontend Config:', e.message);
    return false;
  }
}

// Запуск всех тестов
async function runAllTests() {
  const results = [];
  
  results.push(await testHealth());
  results.push(await testApiHealth());
  const loginResult = await testLogin();
  results.push(loginResult.success);
  
  if (loginResult.success) {
    results.push(await testAuthorizedApi(loginResult.token));
  }
  
  results.push(await testWrongPassword());
  results.push(await testFrontendConfig());
  
  console.log('\n' + '='.repeat(50));
  const passed = results.filter(r => r).length;
  const total = results.length;
  console.log(`📊 Результаты: ${passed}/${total} тестов пройдено`);
  
  if (passed === total) {
    console.log('✅ Все тесты пройдены! Frontend готов к работе с Backend.');
  } else {
    console.log('⚠️ Некоторые тесты не пройдены. Проверьте конфигурацию.');
  }
  
  process.exit(passed === total ? 0 : 1);
}

runAllTests();
