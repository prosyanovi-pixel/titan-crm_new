# Quotes Module

> 📄 **Синхронизировано** с [docs/modules/quotes.md](../../docs/modules/quotes.md) — актуальная компактная спецификация модуля.

## Назначение (Purpose)
Создание и ведение коммерческих предложений (КП): формирование из позиций прайс-листов, конвертация в договоры.

## Основные функции (Core Functions)
- Создание КП и привязка к контрагенту
- Позиции КП (товары/услуги с ценами)
- Статусы и конвертация КП в договор
- Генерация печатной формы / PDF

## Технические спецификации (Technical Specifications)

### Ключевые файлы (Key Files)
- Frontend: `frontend/src/modules/quotes/pages/QuoteFormPage.tsx`, `QuotesPage.tsx`
- Backend: `backend/modules/quotes/routes.js`, монтируется на `/api/quotes`

### API конечные точки (API Endpoints)
- `GET/POST /api/quotes` — КП
- `GET/PUT/DELETE /api/quotes/:id`
- `/api/quotes/:id/items` — позиции
- `POST /api/quotes/:id/convert` — конвертация в договор
- `GET /api/quotes/:id/pdf` — печатная форма

### Схема базы данных (Database Schema)
- `quotes`
- `quote_items`

## Структура компонентов (Component Structure)
- QuotesPage.tsx (реестр КП)
- QuoteFormPage.tsx (создание/редактирование)

## Лучшие практики (Best Practices)
- Позиции КП копировать из прайс-листа со снапшотом цены (не хранить ссылки, которые могут измениться)
- Конвертация КП → договор должна проходить через статусную модель с аудитом