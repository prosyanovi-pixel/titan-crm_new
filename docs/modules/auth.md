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
- Frontend: `frontend/src/modules/auth/pages/` (Login, ResetPassword), `frontend/src/modules/auth/api/authService.ts`
- Backend: `backend/modules/auth/` (routes.js, controllers.js, services/authService.js), монтируется на `/api/auth`

### API конечные точки
- `GET /api/auth/` — проверка сессии/текущего пользователя
- `POST /api/auth/login` — вход, получение JWT
- `POST /api/auth/forgot-password` — запрос восстановления пароля (ссылка через Telegram/e-mail)
- `POST /api/auth/reset-password` — установка нового пароля по токену

Отдельных эндпоинтов `logout` и `refresh` нет — токен инвалидируется на клиенте.

### Схема базы данных
- `users` — учётные записи (email, nickname, password_hash, role, telegram_token, is_blocked, reset_token, reset_token_expires)

## Структура компонентов
- Login.tsx
- ResetPassword.tsx

## Лучшие практики
- Пароли хранить только в виде bcrypt-хеша (`password_hash`)
- Токен передавать в заголовке `Authorization: Bearer <token>`
- На фронтенде проверять права через `usePermission` / `<Can>`, а не по факту входа