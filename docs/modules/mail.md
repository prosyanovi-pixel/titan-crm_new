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

### API конечные точки
- `GET/POST /api/mail/...` — письма, папки, метки, фильтры, шаблоны
- `/api/mail/:mailId/attachments` — вложения
- `/api/chats/...`, `/api/chats/:id/messages` — чаты и сообщения

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