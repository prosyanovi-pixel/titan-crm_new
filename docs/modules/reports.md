# Модуль Отчёты (reports)

## Назначение
Конструктор отчётов, просмотр отчётов и аналитических панелей: сохранённые конфигурации отчётов, генерация, экспорт.

## Основные функции
- Конструктор отчётов (Report Builder)
- Просмотр отчётов по сохранённым конфигурациям
- Статусы генерации отчётов
- Аналитические панели (dashboard-отчёты)

## Технические спецификации

### Ключевые файлы
- Frontend: `frontend/src/modules/reports/pages/ReportBuilderPage.tsx`, `ReportViewPage.tsx`, `ReportsPage.tsx`, `api/reports.api.ts`
- Backend: `backend/modules/reports/routes.js`

### API конечные точки
- `GET/POST /api/reports` — отчёты
- `GET /api/reports/:id` — просмотр
- `POST /api/reports/:id/generate`, `/:id/generate-bulk`, `/:id/generate-bulk-async` — генерация
- `GET /api/reports/:id/pdf`, `/:id/download`, `/:file` — выгрузка файлов
- `/api/reports/dashboard` — данные для дашборда

### Схема базы данных
- `report_configs` — сохранённые конфигурации отчётов
- `report_status` — статусы генерации

## Структура компонентов
- ReportsPage.tsx (реестр отчётов)
- ReportBuilderPage.tsx (конструктор)
- ReportViewPage.tsx (просмотр)

## Лучшие практики
- Долгие генерации выполнять асинхронно (bulk/queue) с сохранением статуса
- Отчёты строить на агрегированных SQL-запросах с учётом прав доступа пользователя