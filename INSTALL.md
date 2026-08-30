# Установка и настройка TITAN CRM

В репозитории есть **мастер установки и настройки** для всех основных ОС. Он выполняет полный цикл: проверка окружения → автоматическая установка недостающих компонентов → настройка `backend/env` и `frontend/.env` → создание базы данных → установка зависимостей → миграции → создание учётной записи администратора (с паролем).

После успешной установки мастер сохраняет файл **`INSTALL-INFO.txt`** (права `600`) — в нём адреса, доступы к БД, пароль администратора и правила запуска. Файл не должен попадать в git.

## Быстрый старт

### macOS / Linux / WSL
```bash
./install.sh
```

### Windows (PowerShell 5.1+)
```powershell
.\install.ps1
```

### Windows (CMD / Batch)
Установлена только установка зависимостей (старый скрипт):
```cmd
init.bat
```
Для полной установки используйте PowerShell-версию мастера.

> При первом запуске `install.ps1` может потребоваться разрешить выполнение скриптов:
> ```powershell
> Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
> .\install.ps1
> ```

## Автоматическая установка (без вопросов)

```bash
./install.sh --yes
```

С параметрами:

```bash
# Своя БД и администратор
./install.sh --yes \
  --db-name crm_prod --db-user postgres --db-pass 'secret' \
  --admin-email admin@example.ru --admin-pass 'Qwerty123!'

# Только настройка окружения и зависимости (без БД и миграций)
./install.sh --yes --skip-db --skip-migrate
```

## Опции мастера

| Опция (sh) | Опция (ps1) | Назначение |
|---|---|---|
| `-y, --yes` | `-Yes` | Не задавать вопросов, значения по умолчанию |
| `--skip-deps` | `-SkipDeps` | Не устанавливать npm-зависимости |
| `--skip-db` | `-SkipDb` | Не создавать базу данных |
| `--skip-users` | `-SkipUsers` | Не создавать администратора |
| `--skip-migrate` | `-SkipMigrate` | Не применять миграции |
| `--backend-port N` | `-BackendPort N` | Порт backend (по умолчанию `5001`) |
| `--frontend-url URL` | `-FrontendUrl URL` | URL фронтенда для писем (по умолчанию `http://localhost:3001`) |
| `--db-host/--db-port/--db-name/--db-user/--db-pass` | `-DbHost/...` | Параметры PostgreSQL |
| `--admin-name/--admin-email/--admin-pass/--admin-role` | `-AdminName/...` | Учётка администратора |
| `--no-color` | — | Без цветов в выводе |
| `-h, --help` | `-Help` | Справка |

Полный список — `./install.sh --help`.

## Что делает мастер (шаг за шагом)

1. **Проверка окружения и установка недостающего** — мастер проверяет наличие `node`, `npm` и `psql`. Если чего-то нет:
   - **при наличии пакетного менеджера** (`brew`, `apt-get`, `dnf`, `pacman`, `zypper`, `apk`) — автоматически (в режиме `--yes`) или после подтверждения устанавливает недостающее (на macOS также умеет ставить Homebrew с нуля);
   - **если пользователь отказался** от установки — мастер останавливается и сообщает, что установка невозможна, с перечнем недостающих компонентов (код выхода `1`);
   - после установки зависимости перепроверяются: если компонент так и не появился — установка останавливается с ошибкой.
2. **Сбор параметров** — порты, подключение к PostgreSQL (интерактивно или из опций/существующего `backend/env`).
3. **Конфигурация окружения**
   - `backend/env` — создаётся из `backend/env.example` (если нет) или обновляется с резервной копией `env.bak.*`; обновляются `PORT`, `API_URL`, `FRONTEND_URL`, `DB_*`;
   - секреты `JWT_SECRET` и `ENCRYPTION_KEY` генерируются заново, если стоят значения-заглушки;
   - `frontend/.env` — создаётся из `frontend/.env.example`, подставляются `VITE_API_URL` и `VITE_API_BACKEND_URL`.
4. **База данных** — если psql доступен и у пользователя есть права: проверка/создание базы, включение расширения `pgcrypto` (если не удалось — миграции попробуют сами).
5. **Зависимости** — `npm install` в корне, `backend/`, `frontend/`.
6. **Миграции** — `node backend/migrate.js`.
7. **Администратор** — имя, e-mail (логин), пароль (вводится скрыто, дважды); пароль хешируется bcrypt и сохраняется в `users.password_hash`. Если пользователь с таким e-mail уже есть — пароль/роль обновляются.
8. **Файл-инструкция** — создаётся `INSTALL-INFO.txt` (адреса, доступы, пароли, правила запуска). Помечен `600` и не коммитится в git.

## Требования

- **Node.js** >= 18 (рекомендуется 20+)
- **npm** >= 8 (поставляется с Node.js)
- **PostgreSQL** >= 13, запущенный сервер
- Расширение **pgcrypto** (миграции включают его автоматически; при отсутствии прав включите вручную, см. README.md)

Порты по умолчанию:

| Компонент | Порт |
|---|---|
| Backend API | `5001` |
| Frontend (Vite dev) | `3001` |
| PostgreSQL | `5432` |

## Ручная установка (альтернатива мастеру)

```bash
# 1. Зависимости (monorepo с workspaces)
npm install

# 2. Настройка backend (создать из шаблона и отредактировать)
cd backend
cp env.example env
# PORT, DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD, JWT_SECRET, ENCRYPTION_KEY

# 3. Настройка frontend
cd ../frontend
cp .env.example .env
# VITE_API_URL=http://localhost:5001/api

# 4. База данных (создать при необходимости)
psql -h localhost -U myuser -d postgres -c "CREATE DATABASE titancrm1 OWNER myuser;"

# 5. Миграции
cd ../backend
npm run migrate

# 6. Запуск
npm run dev          # backend, http://localhost:5001/api
cd ../frontend
npm run dev          # frontend,  http://localhost:3001
```

## Конфигурация npm

Проект использует `.npmrc` с настройкой `legacy-peer-deps=true` для разрешения конфликтов peer dependencies. **Не удаляйте файл `.npmrc`**.

### Ошибка ERESOLVE (conflicting peer dependencies)
```
npm error ERESOLVE could not resolve
```
Убедитесь, что `.npmrc` существует и содержит `legacy-peer-deps=true`, затем повторите `npm install`.

## Очистка и переустановка

macOS / Linux:
```bash
rm -rf node_modules frontend/node_modules backend/node_modules package-lock.json
npm install
```

Windows (PowerShell):
```powershell
Remove-Item -Recurse -Force node_modules, frontend\node_modules, backend\node_modules, package-lock.json
npm install
```

## Запуск проекта

```bash
# Backend
cd backend
npm run dev          # http://localhost:5001/api

# Frontend (в отдельном терминале)
cd frontend
npm run dev          # http://localhost:3001
```

## Возможные проблемы

### Ошибка миграции БД
- Убедитесь, что PostgreSQL запущен, а параметры в `backend/env` верны.
- Проверьте права на создание расширений: `CREATE EXTENSION IF NOT EXISTS pgcrypto;` (см. README.md).

### Ошибка "Cannot find module 'simple-update-notifier'"
Повреждённая зависимость nodemon. Решение — переустановка:
```powershell
Remove-Item -Recurse -Force node_modules\simple-update-notifier
npm install
```

### Уязвимости зависимостей
Предупреждения об уязвимостях в dev-зависимостях не влияют на production. Для проверки:
```bash
npm audit fix
```
**Не используйте `npm audit fix --force` без тестирования** — возможны breaking changes.