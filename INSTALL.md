# Установка зависимостей TITAN CRM

## Быстрый старт

### Windows (PowerShell)
```powershell
.\init.ps1
```

### Windows (CMD / Batch)
```cmd
init.bat
```

### Linux / macOS
```bash
./init.sh
```

Или вручную:
```bash
npm install
```

## Конфигурация npm

Проект использует файл `.npmrc` с настройкой `legacy-peer-deps=true` для разрешения конфликтов peer dependencies между пакетами.

**Не удаляйте файл `.npmrc`** - это критически важно для корректной установки зависимостей.

## Основные проблемы и решения

### Ошибка ERESOLVE (conflicting peer dependencies)

Если вы видите ошибку вида:
```
npm error ERESOLVE could not resolve
npm error While resolving: react-i18next@17.0.8
npm error Found: typescript@4.9.5
```

**Решение:** Убедитесь, что файл `.npmrc` существует в корне проекта и содержит:
```
legacy-peer-deps=true
```

Затем выполните:
```bash
npm install
```

###Missing i18next dependency

Если возникает ошибка о недостающем `i18next`:
```
peer i18next@">= 26.2.0" from react-i18next@17.0.8
```

**Решение:** Зависимость `i18next` уже добавлена в `frontend/package.json`. Просто выполните:
```bash
npm install
```

## Структура зависимостей

Проект использует monorepo с workspaces:
- `frontend/` - React + TypeScript + Vite
- `backend/` - Node.js + Express
- Корневой `package.json` - общие dev dependencies и скрипты

## Проверка установки

```bash
# Проверка установленных зависимостей
npm ls --depth=0

# Проверка конкретной зависимости
npm ls i18next
```

## Уязвимости зависимостей

При установке могут отображаться предупреждения об уязвимостях:
```
30 vulnerabilities (5 low, 22 moderate, 3 high)
```

Большинство из них находятся в dev dependencies и не влияют на production. Для исправления:
```bash
npm audit fix
```

**Внимание:** Не используйте `npm audit fix --force` без тестирования, так как это может установить breaking changes.

## Очистка и переустановка

Если возникли проблемы с зависимостями:

```bash
# Удалить node_modules и lock файл
rm -rf node_modules frontend/node_modules backend/node_modules package-lock.json

# Переустановить зависимости
npm install
```

В PowerShell (Windows):
```powershell
Remove-Item -Recurse -Force node_modules, frontend\node_modules, backend\node_modules, package-lock.json
npm install
```

## Запуск проекта

### Backend
```bash
cd backend
npm run dev
```

Сервер запустится на `http://localhost:3001` (порт может быть настроен в `backend/env`).

### Frontend
```bash
cd frontend
npm run dev
```

Frontend запустится на `http://localhost:5173` (по умолчанию для Vite).

### Из корня проекта (опционально)
```bash
# Запустить только frontend
npm start
```

## Возможные проблемы

### Ошибка "Cannot find module 'simple-update-notifier'"

Это проблема с повреждённой зависимостью nodemon. Решение:

```powershell
# PowerShell (из корня проекта)
Remove-Item -Recurse -Force node_modules\simple-update-notifier
npm install
```

Или полная переустановка:
```powershell
Remove-Item -Recurse -Force node_modules
npm install
```
