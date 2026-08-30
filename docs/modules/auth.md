# Модуль Авторизация (auth)

## Назначение
Модуль отвечает за аутентификацию пользователей: вход в систему, выход, восстановление пароля. Работает на JWT-токенах.

## Основные функции
- Вход по e-mail и паролю (выдача JWT)
- Сброс и восстановление пароля
- Защита маршрутов по токену
- Определение текущего пользователя и его роли

## Технические спецификации

### Ключевые файлы
- Frontend: `frontend/src/modules/auth/pages/` (Login, ResetPassword), `api/authService.ts`
- Backend: `backend/modules/auth/routes.js`, монтируется на `/api/auth`

### API конечные точки
- `POST /api/auth/login` — вход, получение токена
- `POST /api/auth/logout`
- `POST /api/auth/refresh` — обновление JWT
- `POST /api/auth/reset-password` (и сопутствующие) — восстановление пароля

### Схема базы данных
- `users` — учётные записи (email, password_hash, role, status)

## Структура компонентов
- Login.tsx
- ResetPassword.tsx

## Лучшие практики
- Пароли хранить только в виде bcrypt-хеша (`password_hash`)
- Токен передавать в заголовке `Authorization: Bearer <token>`
- На фронтенде проверять права через `usePermission` / `<Can>`, а не по факту входа