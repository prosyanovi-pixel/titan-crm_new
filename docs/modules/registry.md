# Модуль Реестры (registry)

## Назначение
Служебный модуль реестров: унифицированный просмотр и управление записями разных сущностей (заготовка под расширяемые реестры).

## Основные функции
- Универсальный механизм реестров (списков) сущностей
- Метаданные модулей и связь с `module_settings`

## Технические спецификации

### Ключевые файлы
- Frontend: `frontend/src/modules/registry/` — ActionRegistry (`ActionRegistry.ts`, `registerDefaultActions.ts`, `manifests.tsx`), хуки `useModuleActions`, `useBulkActions`
- Backend: `backend/modules/registry/index.js` — экспортирует только настройки, API отсутствует (пустой роутер на `/api/registry`)

### API конечные точки
- Отсутствуют (backend-часть модуля — только настройки для маркетплейса модулей)

### Схема базы данных
- `modules`, `module_settings` — настройки модулей и действий

## Структура компонентов
- ActionRegistry.ts — реестр межмодульных действий
- registerDefaultActions.ts — дефолтные действия модулей
- hooks/useModuleActions.ts, hooks/useBulkActions.ts

## Лучшие практики
- При развитии модуля следовать паттернам модульных границ и системы прав