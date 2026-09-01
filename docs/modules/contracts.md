# Модуль Договоры

## Назначение
Модуль договоров отвечает за управление договорами, включая создание, хранение и документооборот.

## Основные функции
- Создание и управление договорами
- Прикрепление документов к договорам
- Отслеживание статуса договоров
- Управление продлением договоров
- Контроль версий документов

## Технические спецификации

### Ключевые файлы
- Frontend: `frontend/src/modules/contracts/` — ContractsPage, ContractDetailPage, ContractCreatePage, ContractTemplatesPage, `api/contractService.ts`
- Backend: `backend/modules/contracts/` (routes.js — согласования/версии/файлы, core.js — CRUD)

### API конечные точки
- `GET /api/contracts`, `GET /api/contracts/metrics` - Список договоров и метрики
- `POST /api/contracts` - Создание договора
- `GET/PUT/DELETE /api/contracts/:id` - Работа с конкретным договором
- `POST /api/contracts/bulk-delete`, `POST /api/contracts/bulk-update-status` - Массовые операции
- `POST /api/contracts/case/:caseId` - Создание договора из дела
- Шаблоны: `GET /api/contracts/templates/list`, `POST /api/contracts/templates`, `PUT/DELETE /api/contracts/templates/:id`
- Согласование: `POST /:id/send-for-approval`, `POST /:id/approve/:step`, `POST /:id/reject/:step`, `POST /:id/approvals/cancel`, `GET /:id/approval-history`
- Версии: `POST /:id/create-version`, `GET /:id/versions`, `POST /:id/revert-to-version/:versionId`, `DELETE /:id/versions/:versionId`
- Файлы: `POST /:id/upload` (multipart), `GET /:id/files`, `DELETE /:id/files/:fileId`, `GET /:id/actual-file`
- Связь с делами: `POST /:id/link-case/:caseId`, `DELETE /:id/unlink-case/:caseId`

### Схема базы данных
- `contracts`, `contract_status` - договоры и статусы
- `contract_templates` - шаблоны договоров
- `contract_versions` - версии договоров
- `contract_approvals` - согласования
- `contract_files` - файлы договоров
- `contract_cases` - связь договоров с юридическими делами
- `contract_audit_log` - журнал аудита
- `contract_payment_status` - статус оплаты

## Структура компонентов
- ContractsPage.tsx, ContractDetailPage.tsx, ContractCreatePage.tsx, ContractTemplatesPage.tsx
- ContractList.tsx, ContractKanbanBoard.tsx, ContractForm.tsx, ContractSheet.tsx
- VersionHistory.tsx, ApprovalWorkflow.tsx, SendForApprovalDialog.tsx, FileUpload.tsx

## Лучшие практики
- Обеспечение правильного отслеживания статуса договора
- Реализация управления документами
- Уведомления о сроках действия договоров
- Поддержка версионирования документов