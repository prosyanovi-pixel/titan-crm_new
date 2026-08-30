# Reports Module

> 📄 **Синхронизировано** с [docs/modules/reports.md](../../docs/modules/reports.md) — актуальная компактная спецификация модуля. Заменяет устаревший раздел «Reporting».

## Назначение (Purpose)
Конструктор отчётов, просмотр отчётов и аналитических панелей: сохранённые конфигурации отчётов, генерация, экспорт.

## Основные функции (Core Functions)
- Конструктор отчётов (Report Builder)
- Просмотр отчётов по сохранённым конфигурациям
- Статусы генерации отчётов
- Аналитические панели (dashboard-отчёты)

## Технические спецификации (Technical Specifications)

### Ключевые файлы (Key Files)
- Frontend: `frontend/src/modules/reports/pages/ReportBuilderPage.tsx`, `ReportViewPage.tsx`, `ReportsPage.tsx`, `api/reports.api.ts`
- Backend: `backend/modules/reports/routes.js`

### API конечные точки (API Endpoints)
- `GET/POST /api/reports` — отчёты
- `GET /api/reports/:id` — просмотр
- `POST /api/reports/:id/generate`, `/:id/generate-bulk`, `/:id/generate-bulk-async` — генерация
- `GET /api/reports/:id/pdf`, `/:id/download`, `/:file` — выгрузка файлов
- `/api/reports/dashboard` — данные для дашборда

### Схема базы данных (Database Schema)
- `report_configs` — сохранённые конфигурации отчётов
- `report_status` — статусы генерации

## Структура компонентов (Component Structure)
- ReportsPage.tsx (реестр отчётов)
- ReportBuilderPage.tsx (конструктор)
- ReportViewPage.tsx (просмотр)

## Лучшие практики (Best Practices)
- Долгие генерации выполнять асинхронно (bulk/queue) с сохранением статуса
- Отчёты строить на агрегированных SQL-запросах с учётом прав доступа пользователя