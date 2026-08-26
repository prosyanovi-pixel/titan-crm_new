# TITAN CRM - Быстрый старт

## 🚀 Установка и запуск

### 1. Установка зависимостей

**Windows PowerShell:**
```powershell
.\init.ps1
```

**Windows CMD:**
```cmd
init.bat
```

**Linux/macOS:**
```bash
./init.sh
```

### 2. Настройка базы данных

Создайте файл `backend/env` на основе `backend/env.example`:
```bash
cd backend
cp env.example env
```

Отредактируйте `backend/env` и укажите параметры подключения к PostgreSQL.

### 3. Миграция базы данных
```bash
cd backend
npm run migrate
```

### 4. Запуск проекта

**Backend (порт 3001):**
```bash
cd backend
npm run dev
```

**Frontend (порт 5173):**
```bash
cd frontend
npm run dev
```

## 📋 Требования

- **Node.js** >= 18.x (рекомендуется v20+)
- **PostgreSQL** >= 13
- **npm** >= 8.x (поставляется с Node.js)

## 🔧 Решение проблем

### Ошибка установки зависимостей
```powershell
# Очистить и переустановить
Remove-Item -Recurse -Force node_modules, frontend\node_modules, backend\node_modules, package-lock.json
npm install
```

### Ошибка политики выполнения PowerShell
```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\init.ps1
```

### Ошибка миграции БД
Убедитесь, что PostgreSQL запущен и параметры в `backend/env` верны.

## 📚 Документация

- **Установка зависимостей** - `INSTALL.md`
- **Скрипты инициализации** - `docs/INIT-SCRIPTS.md`
- **Backend документация** - `docs/backend/README.md`
- **Миграции** - `backend/migrations/README.md`

## 🎯 Основные команды

```bash
# Тесты
npm test                    # Все тесты
npm run test:frontend       # Frontend тесты
npm run test:backend        # Backend тесты
npm run test:e2e           # E2E тесты

# Backend
cd backend
npm run dev                # Запуск в режиме разработки
npm run migrate            # Применить миграции
npm run reset              # Сбросить БД

# Frontend
cd frontend
npm run dev                # Запуск в режиме разработки
npm run build              # Сборка production версии
npm run lint               # Проверка линтером
```

## 📞 Поддержка

Возникли проблемы? Проверьте:
1. Файл `INSTALL.md` - решение распространённых проблем
2. Файл `docs/INIT-SCRIPTS.md` - информация о скриптах установки
3. Логи ошибок в консоли
