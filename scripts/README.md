# Скрипты TITAN CRM

Эта директория содержит utility-скрипты для различных задач.

## Структура

### Shell скрипты (.sh)
- `analyze_root_docs.sh` - Анализ документации в корне
- `backend-restart.sh` - Перезапуск backend сервера
- `backup-system.sh` - Резервное копирование базы данных
- `docs_cleanup.sh` - Очистка документации
- `git-helper.sh` - Вспомогательный скрипт для git
- `init.sh` - Инициализация зависимостей проекта
- `test-disabled-folders.sh` - Тестирование отключенных папок
- `check-hardcoded-russian.sh` - Поиск захардкоженного русского текста

### Batch файлы (.bat) - Windows
- `start.bat` - Запуск проекта (Windows)
- `start-simple.bat` - Простой запуск (Windows)
- `stop.bat` - Остановка проекта (Windows)

### JavaScript скрипты (.js)
- `check_docs_schema.js` - Проверка схемы документации
- `check_schema.js` - Проверка схемы базы данных
- `extract_defined.js` - Извлечение определений
- `patch.js` - Применение патчей
- `test-references.js` - Тестирование ссылок
- `restore-bootstrap.js` - Восстановление bootstrap конфигурации
- `check-hardcoded-russian.js` - Поиск захардкоженного русского текста (JS версия)
- `check-russian-text.js` - Проверка русского текста
- `generate_report.js` - Генерация отчетов
- `test-frontend-api.js` - Тестирование frontend API
- `test-imap-sync.js` - Тестирование IMAP синхронизации
- `test-integration.js` - Интеграционное тестирование
- `test-nan.js` - Тестирование NaN значений

### PowerShell скрипты (.ps1)
- `check-hardcoded-russian.ps1` - Поиск захардкоженного русского текста (PowerShell версия)

## Использование

Для запуска shell скриптов:
```bash
./scripts/init.sh
```

Для запуска batch файлов (Windows):
```cmd
scripts\start.bat
```
