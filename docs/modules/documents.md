# Модуль Документы

## Назначение
Модуль документов обеспечивает хранение, управление и доступ к документам в системе.

## Основные функции
- Хранение и организация документов
- Управление версиями документов
- Поиск и фильтрация документов
- Разграничение прав доступа к документам
- Экспорт документов

## Технические спецификации

### Ключевые файлы
- Frontend: `frontend/src/modules/documents/` — DocumentsPage, `api/documents.api.ts`, `api/documentService.ts`
- Backend: `backend/modules/documents/` (controllers/documents.js, controllers/documentsAccess.js), prefix `/api/documents`

### API конечные точки
- `GET /api/documents` - Список документов
- `GET /api/documents/stats` - Статистика
- `GET /api/documents/path/:id` - Путь папки
- `POST /api/documents/upload` - Загрузка файла (multipart/form-data)
- `POST /api/documents/folder` - Создание папки
- `PATCH /api/documents/:id/star` - Избранное
- `PATCH /api/documents/:id/template` - Флаг шаблона
- `POST /api/documents/check-exists`, `POST /api/documents/compute-hash` - Проверки при загрузке
- `POST /api/documents/bulk-move`, `POST /api/documents/bulk-rename` - Массовые операции
- `POST /api/documents/restore`, `POST /api/documents/delete` - Восстановление и удаление (корзина)
- `POST /api/documents/trash/delete`, `POST /api/documents/trash/clear` - Очистка корзины
- Доступ: `GET /api/documents/download/:id`, `GET /api/documents/:id/versions`, `GET /api/documents/version/:versionId/download`, `GET /api/documents/share/:id`

### Схема базы данных
- `documents` - документы и метаданные (папки, звёзды, флаг шаблона, мягкое удаление `deleted_at`)
- `document_versions` - версии документов
- `share_links` - ссылки общего доступа

## Структура компонентов
- DocumentsPage.tsx (страница модуля)
- FileCard.tsx, FilePreview.tsx, DocumentStats.tsx
- VersionHistoryDialog.tsx, GlobalDropzone.tsx
- dnd/ (DraggableItem.tsx, DroppableFolder.tsx)

## Лучшие практики
- Обеспечение безопасности хранения документов
- Реализация системы версионирования
- Поддержка различных форматов файлов
- Управление правами доступа к документам