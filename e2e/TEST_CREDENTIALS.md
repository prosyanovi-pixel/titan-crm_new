# E2E Test Credentials

## Тестовые учётные данные

### Администратор
```
Email: info@titan-rus.ru
Nickname: admin
Password: password123
```

### Другие пользователи (из database.sql)
```
Мария Менеджер (manager):
  Email: мария.менеджер@titan.com
  Password: (тот же хеш, что у admin)

Иван Петров (admin):
  Email: info@titan-rus.ru
  Nickname: admin
  Password: admin
```

## Обновление пароля администратора

Если пароль не подходит, можно сбросить его через скрипт:

```bash
cd backend

# Сбросить пароль на 'admin'
node scripts/update-admin-password.js

# Или задать свой пароль
node scripts/update-admin-password.js myNewPassword123
```

## E2E Тесты

### Запуск тестов
```bash
# Все тесты
npm run test:e2e

# Только тесты авторизации
npx playwright test e2e/auth/login.spec.ts

# В режиме UI
npm run test:e2e:ui

# В режиме отладки
npm run test:e2e:debug
```

### Текущие тесты
- `e2e/home.spec.ts` - Проверка загрузки главной страницы
- `e2e/auth/login.spec.ts` - Проверка входа в систему

### Селекторы в Login.tsx
```tsx
// Поля формы
#identifier    // Email или nickname
#password      // Пароль
button[type="submit"]  // Кнопка входа

// Ссылки
button:has-text("Забыли пароль?")  // Восстановление пароля
```

## Troubleshooting

### Тест падает с ошибкой авторизации
1. Проверьте, что база данных содержит пользователя `admin`
2. Убедитесь, что пароль установлен в `admin`
3. Проверьте, что backend запущен и доступен

```bash
# Проверка пользователей в БД
cd backend
node test/check-users.js

# Тест входа
node test/test-login.js
```

### Frontend не показывает форму входа
- Убедитесь, что frontend запущен: `npm run dev`
- Проверьте логин страницу: `http://localhost:3000/login`
