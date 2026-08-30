# Contracts Module

> 📄 **Синхронизировано** с [docs/modules/contracts.md](../../docs/modules/contracts.md) — актуальная компактная спецификация модуля.

## Назначение (Purpose)
Управление договорами: реестр договоров, статусы, версии шаблонов, конвертация из коммерческих предложений.

## Основные функции (Core Functions)
- Реестр договоров и их статусы
- Шаблоны договоров и их версии
- Конвертация КП в договор
- Документы и файлы, привязанные к договору

## Технические спецификации (Technical Specifications)

### Ключевые файлы (Key Files)
- Frontend: `frontend/src/modules/contracts/pages/ContractsPage.tsx`, `api/contractService.ts`, `api/contracts.api.ts`
- Backend: `backend/modules/contracts/routes.js`

### API конечные точки (API Endpoints)
- `GET/POST /api/contracts` — договоры
- `GET/PUT/DELETE /api/contracts/:id` — карточка договора
- `GET /api/contracts/:id/pdf` — печатная форма
- Шаблоны договоров — см. `contract_templates`, `template_versions`

### Схема базы данных (Database Schema)
- `contracts`
- `contract_status` — статусы договоров (справочник)
- `contract_templates`, `template_versions` — шаблоны и их версии
- Связь с контрагентами через `contractor_id`, с КП — через `quote_id`

## Структура компонентов (Component Structure)
- ContractsPage.tsx (реестр договоров)

## Лучшие практики (Best Practices)
- Версионирование шаблонов: не перезаписывать «молча», фиксировать версии
- Генерацию PDF выполнять на бэкенде с подстановкой данных
- Статусы договоров вести справочником `contract_status`