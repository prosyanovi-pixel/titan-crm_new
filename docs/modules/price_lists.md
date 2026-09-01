# Модуль Прайс-листы (price_lists)

## Назначение
Ведение прайс-листов: перечней позиций с ценами для продуктов и услуг.

## Основные функции
- Создание и ведение прайс-листов
- Позиции прайс-листа (товары/услуги и их цены)
- Привязка прайс-листов к продажам и коммерческим предложениям

## Технические спецификации

### Ключевые файлы
- Frontend: `frontend/src/modules/price_lists/pages/PriceListsPage.tsx`
- Backend: `backend/modules/price_lists/routes.js`, монтируется на `/api/price-lists`

### API конечные точки (префикс `/api/price-lists`)
- `GET /api/price-lists` — список прайс-листов
- `GET /api/price-lists/:id` — карточка прайс-листа
- `POST /api/price-lists`, `PUT /:id`, `DELETE /:id` — CRUD
- `POST /api/price-lists/bulk-update`, `POST /bulk-delete` — массовые операции
- Позиции: `GET /:id/items`, `POST /:id/items`, `POST /:id/bulk-items`
- Экспорт: `GET /api/price-lists/:id/pdf`

### Схема базы данных
- `price_lists`
- `price_list_items`

## Структура компонентов
- PriceListsPage.tsx

## Лучшие практики
- Цены хранить в денежном формате с фиксированной точностью
- Изменения цен версионировать при необходимости (см. шаблоны версионирования документов)