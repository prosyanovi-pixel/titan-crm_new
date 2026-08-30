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
- `GET/PUT /api/settings/:module` — настройки модуля
- `GET /api/settings/:moduleId/:key` — конкретное значение
- `POST/PUT /api/settings/:moduleId/bulk-edit` — массовое редактирование
- `/api/settings/:moduleId/bulk-edit/enabled` — включение/выключение

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