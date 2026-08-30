# Модуль Шаблоны (templates)

## Назначение
Шаблоны документов, писем и договоров: создание, редактирование, версии и генерация документов по шаблонам.

## Основные функции
- Создание и редактирование шаблонов
- Версионирование шаблонов (создание версий, откат)
- Применение шаблона для генерации документов (договоры, письма)
- Просмотр деталей шаблона

## Технические спецификации

### Ключевые файлы
- Frontend: `frontend/src/modules/templates/pages/TemplateCreatePage.tsx`, `TemplateDetailPage.tsx`, `TemplatesPage.tsx`
- Backend: `backend/modules/templates/routes.js`

### API конечные точки
- `GET/POST /api/templates` — шаблоны
- `GET/PUT/DELETE /api/templates/:id`
- `POST /api/templates/:id/create-version` — создание версии
- `POST /api/templates/:id/revert-to-version/:versionId` — откат к версии
- `GET /api/templates/:id/versions` — список версий

### Схема базы данных
- Шаблоны договоров: `contract_templates`
- Шаблоны писем: `mail_templates`
- Документные шаблоны: см. `document_versions` и связь с `documents`

## Структура компонентов
- TemplatesPage.tsx (реестр шаблонов)
- TemplateCreatePage.tsx (создание)
- TemplateDetailPage.tsx (детали/версии)

## Лучшие практики
- Каждое изменение шаблона фиксировать версией — не перезаписывать «молча»
- Генерацию документов по шаблонам выполнять на бэкенде (PDF/ODT) с подстановкой данных