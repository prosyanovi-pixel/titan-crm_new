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

### API конечные точки (префикс `/api/templates`)
- `GET /api/templates` — список шаблонов
- `GET /api/templates/:id` — шаблон
- `POST /api/templates` — создание (multipart, файл)
- `PUT /api/templates/:id` — обновление (multipart, файл)
- `DELETE /api/templates/:id` — удаление
- `GET /api/templates/:id/download` — скачивание файла шаблона
- `POST /api/templates/:id/copy` — копирование
- Генерация документов: `POST /:id/generate`, `POST /:id/generate-action`, `POST /:id/generate-bulk`, `POST /:id/generate-bulk-async`
- Переменные: `GET/POST /api/templates/variables`, `PUT/DELETE /variables/:id`
- Нумераторы: `GET/POST /api/templates/numerators`, `PUT/DELETE /numerators/:id`
- Поля модуля: `GET /api/templates/fields/:moduleId`

Отдельных эндпоинтов версий (`create-version`, `revert-to-version`, `versions`) у шаблонов нет — версии есть у договоров (`/api/contracts/:id/versions`).

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