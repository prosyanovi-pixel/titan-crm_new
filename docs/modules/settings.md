# Модуль Настройки (settings)

## Назначение
Настройки системы: системные параметры, настройки модулей, справочники, управление включением/отключением модулей.

## Основные функции
- Системные настройки (system settings)
- Настройки модулей (module settings, включение/выключение модулей)
- Управление справочными данными
- Массовое редактирование настроек

## Технические спецификации

### Ключевые файлы
- Frontend: `frontend/src/modules/settings/pages/SettingsPage.tsx`, `api/settingsService.ts`, `api/settings.api.ts`, `api/endpoints.ts`
- Backend: `backend/modules/settings/routes.js`

### API конечные точки
- Настройки модулей: `GET /api/module-settings`, `GET /api/module-settings/:moduleId`, `POST/PUT /api/module-settings/:moduleId`, `DELETE /api/module-settings/:moduleId/:key`
- Массовое редактирование: `GET /api/module-settings/bulk-edit`, `GET /api/module-settings/:moduleId/bulk-edit`, `GET /api/module-settings/:moduleId/bulk-edit/enabled`, `POST /api/module-settings/:moduleId/bulk-edit`
- Системные настройки: `GET /api/system-settings`, `POST /api/system-settings`, `POST /api/system-settings/bulk`, интеграции: `POST /api/system-settings/test/email`, `POST /test/telegram`, `GET /dadata/stat`, `GET /apifns/stat`
- Пользовательские настройки: `GET /api/user-settings`, `GET /:key`, `POST /api/user-settings`
- Справочники: `/api/settings/statuses`, `/api/settings/tags`, `/api/settings/priorities`, `/api/settings/project-stages` (legacy-алиасы: `/api/statuses`, `/api/tags`, `/api/priorities`)
- Внешние сервисы: `/api/settings/external/dadata` (info, suggest/party, party, check-key, stat)

### Схема базы данных
- `system_settings` — системные настройки
- `module_settings` — настройки модулей
- `modules` — реестр модулей (включён/выключен)
- Справочники (статусы, типы, категории) — в соответствующих таблицах модулей

## Структура компонентов
- SettingsPage.tsx (настройки)

## Лучшие практики
- Настройки хранить в БД (ключ-значение), а не в константах
- При добавлении нового модуля регистрировать его в `modules` и `module_settings`