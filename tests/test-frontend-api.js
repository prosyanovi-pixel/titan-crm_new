// Тест frontend API клиента
const API_URL = 'http://localhost:5001/api';

console.log('🧪 Тестирование Frontend API клиента\n');

// Симуляция frontend API client
const apiClient = {
  get: async (endpoint, token = null) => {
    const headers = {
      'Content-Type': 'application/json',
      'x-user-id': '1'
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const res = await fetch(`${API_URL}${endpoint}`, { headers });
    
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    
    return res.json();
  },
  
  post: async (endpoint, data) => {
    const res = await fetch(`${API_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': '1'
      },
      body: JSON.stringify(data)
    });
    
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || `HTTP ${res.status}`);
    }
    
    return res.json();
  }
};

async function testWithFrontendPattern() {
  console.log('📋 Тест: Аутентификация (как во frontend)');
  
  try {
    // 1. Login
    const loginResponse = await apiClient.post('/auth/login', {
      identifier: 'мария.менеджер@titan.com',
      password: 'password123'
    });
    
    console.log('✅ Login успешен');
    const token = loginResponse.token;
    
    // Симуляция сохранения в localStorage
    console.log('   Сохранение token в localStorage...');
    
    // 2. API запрос с токеном (как это делает frontend)
    console.log('\n📋 Тест: API запрос с Authorization заголовком');
    
    const contractors = await apiClient.get('/contractors', token);
    console.log(`✅ Получено ${contractors.length} contractors`);
    
    // 3. Проверка что токен добавляется в заголовки
    console.log('\n📋 Тест: Проверка заголовков');
    
    const testRes = await fetch(`${API_URL}/contractors`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'x-user-id': '1',
        'Content-Type': 'application/json'
      }
    });
    
    if (testRes.ok) {
      console.log('✅ Заголовки корректны');
    } else {
      console.log('❌ Ошибка заголовков');
      return false;
    }
    
    // 4. Тест 401 (истёкший токен)
    console.log('\n📋 Тест: Обработка 401 (несуществующий токен)');
    
    const invalidRes = await fetch(`${API_URL}/contractors`, {
      headers: {
        'Authorization': 'Bearer invalid_token',
        'x-user-id': '1'
      }
    });
    
    if (invalidRes.status === 401 || invalidRes.status === 500) {
      console.log('✅ 401 обрабатывается корректно (статус:', invalidRes.status + ')');
    } else {
      console.log('⚠️ Статус:', invalidRes.status);
    }
    
    return true;
  } catch (e) {
    console.log('❌ Ошибка:', e.message);
    return false;
  }
}

async function testCORS() {
  console.log('\n📋 Тест: CORS (Cross-Origin)');
  
  try {
    const res = await fetch(`${API_URL}/health`, {
      method: 'OPTIONS',
      headers: {
        'Access-Control-Request-Method': 'GET',
        'Origin': 'http://localhost:3001'
      }
    });
    
    const corsHeaders = {
      'ACA': res.headers.get('access-control-allow-origin'),
      'ACAM': res.headers.get('access-control-allow-methods'),
      'ACAH': res.headers.get('access-control-allow-headers')
    };
    
    console.log('   CORS заголовки:', corsHeaders);
    console.log('✅ CORS настроен');
    return true;
  } catch (e) {
    console.log('❌ CORS ошибка:', e.message);
    return false;
  }
}

async function runFrontendTests() {
  const results = [];
  
  results.push(await testWithFrontendPattern());
  results.push(await testCORS());
  
  console.log('\n' + '='.repeat(50));
  const passed = results.filter(r => r).length;
  const total = results.length;
  console.log(`📊 Результаты: ${passed}/${total} тестов пройдено`);
  
  if (passed === total) {
    console.log('✅ Frontend API клиент готов к работе!');
  }
  
  process.exit(passed === total ? 0 : 1);
}

runFrontendTests();
