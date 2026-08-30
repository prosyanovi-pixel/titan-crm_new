# Registry Module

> 📄 **Синхронизировано** с [docs/modules/registry.md](../../docs/modules/registry.md) — актуальная компактная спецификация модуля.

## Назначение (Purpose)
Служебный модуль реестров: унифицированный просмотр и управление записями разных сущностей (заготовка под расширяемые реестры).

## Основные функции (Core Functions)
- Универсальный механизм реестров (списков) сущностей
- Метаданные модулей и связь с `module_settings`

## Технические спецификации (Technical Specifications)

### Ключевые файлы (Key Files)
- Frontend: `frontend/src/modules/registry/` (каталог-заготовка)
- Backend: `backend/modules/registry/routes.js`

### API конечные точки (API Endpoints)
- Уточняются по мере реализации модуля (см. `backend/modules/registry/routes.js`)

### Схема базы данных (Database Schema)
- `registry` (при реализации)
- `modules`, `module_settings`

## Структура компонентов (Component Structure)
- На этапе разработки

## Лучшие практики (Best Practices)
- При развитии модуля следовать паттернам модульных границ и системы прав
- Справочники и настройки модулей регистрировать в `modules` / `module_settings`