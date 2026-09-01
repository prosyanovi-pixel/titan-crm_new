# Модуль Юридические дела

## Назначение
Модуль юридических дел отвечает за управление юридическими делами, включая процессуальные действия и документооборот.

## Основные функции
- Создание и управление юридическими делами
- Отслеживание процессуальных действий
- Управление документами по делам
- Визуализация временной шкалы дела
- Уведомления о сроках

## Технические спецификации

### Ключевые файлы
- Backend: `backend/modules/legal_cases/` (routes.js; controllers/cases.js, documents.js, instances.js, courts.js, caseOutcomes.js), prefix `/api/legal-cases`
- Справочники вынесены в отдельные эндпоинты: `/api/courts` и `/api/case-outcomes`

### API конечные точки
- `GET /api/legal-cases` - Список всех дел
- `GET /api/legal-cases/:id` - Получение конкретного дела
- `POST /api/legal-cases` - Создание дела
- `PUT /api/legal-cases/:id` - Обновление дела
- `DELETE /api/legal-cases/:id` - Удаление дела
- `POST /api/legal-cases/sync` - Синхронизация дел
- Обновления дела: `GET /:id/updates/unviewed`, `POST /:id/updates/mark-viewed`, `DELETE /:id/updates/:updateId`, `DELETE /:id/updates`
- Инстансы дел: `GET /:id/instances`, `POST /:id/instances`, `PATCH /instances/:instanceId`, `DELETE /instances/:instanceId`
- Документы: `GET /api/legal-cases/documents/case/:caseId`, `POST /api/legal-cases/documents` (multipart), `GET /documents/files/:filename`, `DELETE /documents/:id`, `POST /documents/cleanup`
- Суды: `GET/POST /api/courts`, `GET/PUT/DELETE /api/courts/:id`, `POST /api/courts/suggest`, `POST /api/courts/select`, судьи: `GET/POST /api/courts/judges`, `GET/PUT/DELETE /api/courts/judges/:id`
- Исходы дел: `GET/POST /api/case-outcomes`, `GET/PUT/DELETE /api/case-outcomes/:id`, `PUT /api/case-outcomes/reorder`

### Схема базы данных
- `legal_cases` - юридические дела
- `case_instances` - инстансы дел
- `case_documents`, `case_document_comments`, `case_note_attachments` - документы дела
- `case_notes`, `case_events`, `case_record_updates` - заметки, события и обновления
- `case_status`, `case_type`, `case_outcome`, `case_third_parties`, `case_financial_details` - справочники и атрибуты дела
- `courts`, `judges` - суды и судьи

## Структура компонентов
- Модуль реализован во фронтенд-модуле `frontend/src/modules/lawyers/` (вкладка Cases, `LawyersPage.tsx`)

## Лучшие практики
- Обеспечение правильного отслеживания статуса дел
- Реализация визуализации временной шкалы
- Управление документами по делам
- Уведомления о важных сроках