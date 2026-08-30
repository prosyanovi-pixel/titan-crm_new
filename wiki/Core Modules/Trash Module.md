# Trash Module

> 📄 **Синхронизировано** с [docs/modules/trash.md](../../docs/modules/trash.md) — актуальная компактная спецификация модуля.

## Назначение (Purpose)
Мягкое удаление и восстановление записей: корзина для сущностей CRM.

## Основные функции (Core Functions)
- Просмотр удалённых записей (корзина)
- Восстановление записей
- Окончательное удаление

## Технические спецификации (Technical Specifications)

### Ключевые файлы (Key Files)
- Frontend: `frontend/src/modules/trash/pages/TrashPage.tsx` (при наличии)
- Backend: `backend/modules/trash/routes.js`

### API конечные точки (API Endpoints)
- `GET /api/trash` — список удалённых записей
- `POST /api/trash/:id/restore` — восстановление
- `DELETE /api/trash/:id` — окончательное удаление

### Схема базы данных (Database Schema)
- Мягкое удаление реализуется флагом `is_deleted`/`deleted_at` в таблицах сущностей либо отдельным журналом корзины

## Структура компонентов (Component Structure)
- TrashPage.tsx (корзина)

## Лучшие практики (Best Practices)
- Удаление связанных записей выполнять транзакционно
- Окончательное удаление подтверждать на UI и логировать в аудит