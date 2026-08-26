# Backend Scripts TITAN CRM

Эта директория содержит **только production-скрипты**, которые прописаны в `package.json`.

## Scripts (из package.json)

### Backup & Restore
| Script | Command | Description |
|--------|---------|-------------|
| `create-backup.js` | `npm run backup` | Создание резервной копии БД |
| `create-full-backup.js` | `npm run backup:full` | Полное резервное копирование |
| `list-backups.js` | `npm run backup:list` | Список доступных бэкапов |
| `download-backup.js` | `npm run backup:download` | Скачивание бэкапа |
| `restore.js` | `npm run restore` | Восстановление из бэкапа |
| `restore-direct.js` | `npm run restore:direct` | Прямое восстановление |

### Database
| Script | Command | Description |
|--------|---------|-------------|
| `get-db-structure.js` | `npm run db:structure` | Получение структуры БД |

### Server Management
| Script | Command | Description |
|--------|---------|-------------|
| `kill-server.js` | `npm run kill:server` | Остановка сервера |

### Modules & Seeding
| Script | Command | Description |
|--------|---------|-------------|
| `sync-modules.js` | `npm run sync:modules` | Синхронизация модулей |
| `seed-all.js` | `npm run seed:all` | Заполнение БД данными |
| `seed-bulk-edit.js` | `npm run seed:bulk-edit` | Настройки массового редактирования |
| `seed_bulk_edit_settings.sql` | — | SQL файл настроек |

## ⚠️ Важно

**НЕ добавляйте** сюда:
- ❌ Диагностические скрипты → `../archive/`
- ❌ Debug/проверочные скрипты → `../archive/`
- ❌ Тестовые скрипты → `../tests/`
- ❌ Миграции → `../migrations/`
- ❌ Сиды → `../seeds/`
