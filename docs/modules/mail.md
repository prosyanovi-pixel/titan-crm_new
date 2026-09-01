# Модуль Почта (mail)

## Назначение
Интеграция с почтовыми ящиками по IMAP/SMTP: письма, папки, метки, фильтры, шаблоны писем, синхронизация и чаты.

## Основные функции
- Подключение почтовых аккаунтов (IMAP/SMTP)
- Просмотр писем, папок и меток
- Фильтры входящей почты (условия фильтрации)
- Шаблоны писем
- Отправка писем (очередь отправки)
- Синхронизация почты (состояние, логи), обработка вложений
- Чаты и сообщения (диалоги внутри системы)

## Технические спецификации

### Ключевые файлы
- Frontend: `frontend/src/modules/mail/pages/Mail.tsx`, `api/mailService.ts`, `api/chats.api.ts`, `api/index.ts`
- Backend: `backend/modules/mail/`, `backend/modules/chats/routes.js`

### API конечные точки (префикс `/api/mail`)
- Аккаунты: `GET/POST /api/mail/accounts`, `GET/PUT/DELETE /api/mail/accounts/:accountId`, `POST /accounts/:accountId/test`, `POST /accounts/:accountId/sync`, `POST /accounts/:accountId/imap-folders`, `POST /accounts/:accountId/sync-folders`, `DELETE /accounts/:accountId/mails`, `POST /test-connection`
- Папки: `GET /api/mail/folders/:accountId`, `GET /folders/:accountId/stats`, `POST /folders`, `PUT/DELETE /folders/:folderId`, `POST /folders/:folderId/clear`, `POST /folders/:folderId/clear-local`, `PATCH /folders/:folderId/read-all`, `POST /folders/:accountId/cleanup-duplicates`
- Письма: `GET /api/mail/`, `GET /:id`, `POST /` (отправка), `PATCH /:id/read`, `PATCH /:id/star`, `PATCH /:id/move`, `DELETE /:id`, `GET /:id/thread`
- Вложения: `POST/GET /:mailId/attachments`, `GET /attachments/download/:attachmentId`, `DELETE /attachments/:attachmentId`, `POST /attachments/:attachmentId/save-to-docs`
- Массовые операции: `POST /bulk/read`, `POST /bulk/move`, `POST /bulk/delete`
- Фильтры: `GET /filters/:accountId`, `POST /filters`, `PUT/DELETE /filters/:filterId`, `POST /filters/:filterId/apply`, `POST /filters/apply-all`
- Шаблоны: `GET/POST /api/mail/templates`, `PUT/DELETE /templates/:id`
- Служебные: `GET /scheduler/status`, `GET /websocket/status`, `POST /system/send-welcome`
- Чаты: `/api/chats/...` (реализация в `backend/modules/chats/routes.js`)

### Схема базы данных
- `mail_accounts`, `mail_folders`, `mail_labels`, `mail_labels_mapping`
- `mail`, `mail_attachments`
- `mail_filters`, `mail_filter_conditions`
- `mail_send_queue`, `mail_sync_logs`, `mail_sync_state`, `mail_templates`
- `chats`, `chat_messages`

## Структура компонентов
- Mail.tsx (почтовый клиент)

## Лучшие практики
- Не хранить пароли почтовых ящиков в открытом виде — использовать шифрование
- Фоновую синхронизацию выполнять через очереди/воркеры, не блокируя API