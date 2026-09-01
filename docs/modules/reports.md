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

### API конечные точки (префикс `/api/reports`)
- `GET /api/reports/preview?reportType=...` — предпросмотр отчёта по типу
- Конфигурации: `GET /api/reports/configs`, `GET /api/reports/configs/:id`, `POST /api/reports/configs`, `PUT /:id`, `DELETE /:id`, `POST /:id/duplicate`
- Готовые отчёты: `GET /api/reports/finance/pl | dds | receivables | register`, `GET /api/reports/projects/summary | tasks-by-status | budget | stages`, `GET /api/reports/contractors/activity | debts | contracts`, `GET /api/reports/lawyers/performance | workload`, `GET /api/reports/tasks/workload | overdue`
- Экспорт: `POST /api/reports/export` (CSV/PDF)

### Схема базы данных
- `report_configs` — сохранённые конфигурации отчётов (со статусом)
- `report_status` — справочник статусов отчётов

## Структура компонентов
- ReportsPage.tsx (реестр отчётов)
- ReportBuilderPage.tsx (конструктор)
- ReportViewPage.tsx (просмотр)

## Лучшие практики
- Долгие генерации выполнять асинхронно (bulk/queue) с сохранением статуса
- Отчёты строить на агрегированных SQL-запросах с учётом прав доступа пользователя