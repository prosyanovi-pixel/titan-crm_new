# Auth Module

> 📄 **Синхронизировано** с [docs/modules/auth.md](../../docs/modules/auth.md) — актуальная компактная спецификация модуля.

## Назначение (Purpose)
Аутентификация и авторизация: вход в систему, регистрация, восстановление пароля, работа с JWT-токенами.

## Основные функции (Core Functions)
- Вход по email/паролю (login) и выход (logout)
- Восстановление/смена пароля
- Выпуск и обновление JWT-токенов
- Проверка текущего пользователя (me)

## Технические спецификации (Technical Specifications)

### Ключевые файлы (Key Files)
- Frontend: `frontend/src/modules/auth/` (страницы входа, компоненты, `api/authService.ts`, `api/auth.api.ts`)
- Backend: `backend/modules/auth/` (роуты, контроллеры)

### API конечные точки (API Endpoints)
- `POST /api/auth/login` — вход
- `POST /api/auth/logout` — выход
- `POST /api/auth/register` — регистрация (опционально)
- `POST /api/auth/refresh` — обновление токена
- `POST /api/auth/change-password` — смена пароля
- `POST /api/auth/forgot-password` — восстановление пароля
- `GET /api/auth/me` — текущий пользователь

### Схема базы данных (Database Schema)
- `users` — пользователи (login, password_hash, status, role)

## Структура компонентов (Component Structure)
- Страница входа, форма восстановления пароля, компоненты авторизации

## Лучшие практики (Best Practices)
- Пароли хранить только в виде хеша (bcrypt/argon2), никогда в открытом виде
- JWT-секрет — из переменной окружения `JWT_SECRET`; в коде не захардкоживать
- Авторизацию проверять middleware на каждом защищённом роуте
- Роль `admin` с правом `*` обходит проверки прав