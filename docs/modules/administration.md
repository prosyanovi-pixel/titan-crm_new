# Модуль Администрирование

## Назначение
Модуль администрирования управляет пользователями, ролью доступа, системными настройками и административными задачами.

## Основные функции
- Управление пользователями (создание, обновление, удаление пользователей)
- Управление ролями и правами доступа
- Конфигурация системных настроек
- Журнал аудита
- Аутентификация пользователей и сессии

## Технические спецификации

### Ключевые файлы
- Backend: `backend/modules/administration/` (prefix `/api/administration`, legacy-алиасы `/api/users`, `/api/roles`, `/api/permissions`, `/api/employees`, `/api/org`, `/api/company`, `/api/admin`)
- Frontend: UI администрирования находится в модуле `frontend/src/modules/settings/` (UserEditor, системные вкладки Users/Db/Health/Logs/Maintenance)

### API конечные точки (users)
- `GET /api/administration/users` - Список всех пользователей
- `GET /api/administration/users/paginated` - Постраничный список
- `GET /api/administration/users/:id` - Получение конкретного пользователя
- `POST /api/administration/users` - Создание нового пользователя
- `PUT|PATCH /api/administration/users/:id` - Обновление пользователя
- `DELETE /api/administration/users/:id` - Удаление пользователя
- `POST /api/administration/users/:id/change-password` - Смена пароля
- `POST /api/administration/users/:id/block` / `POST .../unblock` - Блокировка/разблокировка

### API конечные точки (roles)
- `GET /api/administration/roles` - Список всех ролей
- `POST /api/administration/roles` - Создание новой роли
- `PUT /api/administration/roles/:id` - Обновление роли
- `DELETE /api/administration/roles/:id` - Удаление роли

Системные настройки вынесены в отдельные эндпоинты: `/api/system-settings`, `/api/module-settings`, `/api/user-settings` (модуль settings).

### Схема базы данных
- `users` - данные аутентификации
- `roles`, `permissions` - роли и права доступа
- `administration_audit_log` - журнал административных действий
- `system_settings`, `module_settings` - настройки конфигурации

## Структура компонентов
- `frontend/src/modules/settings/components/UserEditor.tsx`
- `frontend/src/modules/settings/components/system/*` (UsersTab, DbTablesTab, HealthTab, LogsTab, MaintenanceTab)

## Лучшие практики
- Реализация правильного RBAC (контроль доступа по ролям)
- Обеспечение логирования всех административных действий
- Проверка всех входных данных пользователей
- Использование безопасного хэширования паролей