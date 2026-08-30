# Templates Module

> 📄 **Синхронизировано** с [docs/modules/templates.md](../../docs/modules/templates.md) — актуальная компактная спецификация модуля.

## Назначение (Purpose)
Шаблоны документов, писем и договоров: создание, редактирование, версии и генерация документов по шаблонам.

## Основные функции (Core Functions)
- Создание и редактирование шаблонов
- Версионирование шаблонов (создание версий, откат)
- Применение шаблона для генерации документов (договоры, письма)
- Просмотр деталей шаблона

## Технические спецификации (Technical Specifications)

### Ключевые файлы (Key Files)
- Frontend: `frontend/src/modules/templates/pages/TemplateCreatePage.tsx`, `TemplateDetailPage.tsx`, `TemplatesPage.tsx`
- Backend: `backend/modules/templates/routes.js`

### API конечные точки (API Endpoints)
- `GET/POST /api/templates` — шаблоны
- `GET/PUT/DELETE /api/templates/:id`
- `POST /api/templates/:id/create-version` — создание версии
- `POST /api/templates/:id/revert-to-version/:versionId` — откат к версии
- `GET /api/templates/:id/versions` — список версий

### Схема базы данных (Database Schema)
- Шаблоны договоров: `contract_templates`
- Шаблоны писем: `mail_templates`
- Документные шаблоны: см. `document_versions` и связь с `documents`

## Структура компонентов (Component Structure)
- TemplatesPage.tsx (реестр шаблонов)
- TemplateCreatePage.tsx (создание)
- TemplateDetailPage.tsx (детали/версии)

## Лучшие практики (Best Practices)
- Каждое изменение шаблона фиксировать версией — не перезаписывать «молча»
- Генерацию документов по шаблонам выполнять на бэкенде (PDF/ODT) с подстановкой данных