# Модуль Услуги (services)

## Назначение
Каталог услуг с категориями, статусами и тегами; использование услуг в продажах, договорах и проектах.

## Основные функции
- Каталог услуг
- Категории, статусы и теги услуг
- Использование услуг в прайс-листах, коммерческих предложениях и сделках

## Технические спецификации

### Ключевые файлы
- Frontend: `frontend/src/modules/services/pages/ServicesPage.tsx`
- Backend: `backend/modules/services/routes.js`

### API конечные точки (префикс `/api/services`)
- `GET /api/services` — услуги
- `GET /api/services/:id` — карточка услуги
- `POST /api/services` — создание
- `PUT/DELETE /api/services/:id` — обновление/удаление
- `POST /api/services/bulk-delete`, `POST /api/services/bulk-update` — массовые операции
- Категории: `GET /api/services/categories/tree`, `POST /categories`, `PUT/DELETE /categories/:id`

### Схема базы данных
- `services`
- `service_categories`, `service_status`, `service_tags`

## Структура компонентов
- ServicesPage.tsx

## Лучшие практики
- Справочники категорий/статусов/тегов выносить в отдельные таблицы
- Стоимость услуг — в прайс-листах, в карточке услуги хранить только описание и характеристики