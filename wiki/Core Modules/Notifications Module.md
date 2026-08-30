# Notifications Module

> 📄 **Синхронизировано** с [docs/modules/notifications.md](../../docs/modules/notifications.md) — актуальная компактная спецификация модуля.

## Назначение (Purpose)
Система уведомлений: внутрисистемные уведомления, рассылка, настройки предпочтений.

## Основные функции (Core Functions)
- Уведомления пользователей (внутрисистемные)
- Каналы доставки и настройки уведомлений
- Отметка о прочтении, отображение счётчиков

## Технические спецификации (Technical Specifications)

### Ключевые файлы (Key Files)
- Frontend: `frontend/src/modules/notifications/` (компоненты, сервисы)
- Backend: `backend/modules/notifications/routes.js`

### API конечные точки (API Endpoints)
- `GET/POST /api/notifications` — уведомления
- `PATCH /api/notifications/:id/read` — отметка о прочтении
- `GET /api/notifications/unread-count` — количество непрочитанных
- Настройки предпочтений — сопутствующие эндпоинты модуля

### Схема базы данных (Database Schema)
- `notifications`
- `notification_settings` — настройки уведомлений пользователя

## Структура компонентов (Component Structure)
- Колокольчик уведомлений, список/панель уведомлений, настройки

## Лучшие практики (Best Practices)
- Массовые рассылки выполнять асинхронными задачами
- Счётчики непрочитанных обновлять через WebSocket/реалтайм-механизм CRM