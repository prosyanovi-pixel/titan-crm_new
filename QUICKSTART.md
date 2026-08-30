# TITAN CRM - Быстрый старт

## 🚀 Установка и запуск (мастер)

Начните с **мастера установки** — он проверит окружение, настроит конфигурацию, создаст базу данных, установит зависимости, применит миграции и спросит про администратора (имя, e-mail, пароль).

**macOS / Linux / WSL:**
```bash
./install.sh
```

**Windows (PowerShell):**
```powershell
.\install.ps1
```

Без вопросов (значения по умолчанию):
```bash
./install.sh --yes
```

После успешной установки запустите:

**Backend (порт 5001):**
```bash
cd backend
npm run dev
```

**Frontend (порт 3001):**
```bash
cd frontend
npm run dev
```

Войдите в систему по адресу http://localhost:3001 под созданной учётной записью администратора.

## 📋 Требования

- **Node.js** >= 18.x (рекомендуется v20+)
- **PostgreSQL** >= 13 (запущенный сервер)
- **npm** >= 8.x (поставляется с Node.js)

## 🔧 Решение проблем

### Ошибка установки зависимостей
```bash
rm -rf node_modules frontend/node_modules backend/node_modules package-lock.json
npm install
```

### Ошибка политики выполнения PowerShell
```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\install.ps1
```

### Ошибка миграции БД
Убедитесь, что PostgreSQL запущен и параметры в `backend/env` верны (их можно перегенерировать: `./install.sh --skip-deps`).

## 📚 Документация

- **Установка и настройка** - `INSTALL.md`
- **Обзор проекта** - `README.md`
- **Backend документация** - `docs/backend/README.md`
- **Миграции** - `backend/migrations/README.md`

## 🎯 Основные команды

```bash
# Тесты
npm test                    # Все тесты
npm run test:frontend       # Frontend тесты
npm run test:backend        # Backend тесты
npm run test:e2e            # E2E тесты

# Backend
cd backend
npm run dev                # Запуск в режиме разработки (порт 5001)
npm run migrate            # Применить миграции
npm run reset              # Сбросить БД (внимание: полная очистка!)

# Frontend
cd frontend
npm run dev                # Запуск в режиме разработки (порт 3001)
npm run build              # Сборка production версии
npm run lint               # Проверка линтером
```

## 📞 Поддержка

Возникли проблемы? Проверьте:
1. Файл `INSTALL.md` — полная инструкция и решение распространённых проблем
2. Логи ошибок в консоли
3. `./install.sh --help` — справка по параметрам мастера