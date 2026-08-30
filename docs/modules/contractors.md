# Модуль Контрагенты (contractors)

## Назначение
Ядро системы: ведение базы контрагентов (компаний и контактов), их классификация, налоговая история, банковские счета, теги, а также обогащение данных (enrichment).

## Основные функции
- Реестр контрагентов с типами и статусами
- Контакты контрагентов (телефоны, e-mail, адреса)
- Банковские счета контрагентов
- Классификация организационно-правовых форм (ОПФ) и групп
- Налоговая история (изменения налоговых статусов)
- Теги и произвольные метки
- Обогащение данных из внешних источников (enrichment, AI-подсказки)
- Мягкое удаление и корзина

## Технические спецификации

### Ключевые файлы
- Frontend: `frontend/src/modules/contractors/` — ContractorsPage, `api/contractorService.ts`, `api/contractors.api.ts`, `api/endpoints.ts`
- Backend: `backend/modules/contractors/routes.js`, `backend/modules/contractors/taxRoutes.js`

### API конечные точки
- `GET/POST /api/contractors` — список/создание контрагентов
- `GET/PUT/DELETE /api/contractors/:id` — карточка контрагента
- `/api/contractors/:id/contacts`, `/api/contractors/:id/bank-accounts` — контакты и счета
- `/api/contractors/:id/tax-history` — налоговая история
- `/api/contractors/:id/documents` — документы контрагента
- Enrichment-эндпоинты (обогащение данных) — в `backend/modules/enrichment/`

### Схема базы данных
- `contractors`, `contractor_contacts`, `contractor_bank_accounts`
- `contractor_status`, `contractor_type`, `contractor_tags`, `contractor_tax_history`
- `contractor_documents`, `defined_tags`
- `legal_form`, `legal_form_groups` — классификация ОПФ
- `enrichment_jobs`, `enrichment_stats`, `ai_insights` — обогащение

## Структура компонентов
- ContractorsPage.tsx (реестр + карточка контрагента)

## Лучшие практики
- Модуль `contractors` — core domain: единственный фичер-модуль, разрешённый к импорту из других модулей
- Уникальность контрагентов контролировать по ИНН/наименованию (см. импорт и валидацию)
- Новые права доступа синхронизировать в `permissions.ts`, i18n и сидах БД