# TITAN CRM API Documentation

## Overview
Документ описывает фактические API-эндпоинты TITAN CRM. Backend — Node.js + Express, модульная структура (`backend/modules/<module>/`), каждый модуль регистрируется со своим префиксом.

## Authentication
Все запросы (кроме `/api/auth/*`) требуют JWT-токен в заголовке:
`Authorization: Bearer <token>`

Дополнительно фронтенд передаёт заголовок `x-user-id` для отслеживания активности (блокировка заблокированных аккаунтов выполняется на сервере).

## Base URL
`/api`

Версионирование через URL (`/api/v1/...`) **не используется**.

## Modules and Endpoints

| Модуль | Префикс | Примечание |
|---|---|---|
| Auth | `/api/auth` | login, reset-password; `/api/auth/me` — профиль |
| Administration | `/api/administration` | users, roles, permissions, employees, org, company |
| Profile | `/api/profile` | профиль пользователя |
| Settings | `/api/settings` | статусы, теги, приоритеты |
| User settings | `/api/user-settings` | пользовательские настройки |
| Module settings | `/api/module-settings` | настройки модулей |
| System settings | `/api/system-settings` | системные настройки |
| Legacy settings | `/api/statuses`, `/api/tags`, `/api/priorities` | алиасы для совместимости |
| Legacy admin | `/api/users`, `/api/roles`, `/api/permissions`, `/api/employees`, `/api/org`, `/api/company`, `/api/admin` | алиасы administration |
| Contractors | `/api/contractors` | core domain |
| Contracts | `/api/contracts` | |
| Projects | `/api/projects` | |
| Tasks | `/api/tasks` | отдельный модуль (не вложен в projects) |
| Calendar | `/api/calendar` | |
| Documents | `/api/documents` | upload, folders, versions, trash |
| Legal cases | `/api/legal-cases` | |
| Courts | `/api/courts` | справочник судов |
| Case outcomes | `/api/case-outcomes` | справочник исходов |
| Lawyers | `/api/lawyers` | |
| Finance | `/api/finance` | счета, платежи |
| Sales | `/api/sales` | |
| Products | `/api/products` | |
| Services | `/api/services` | |
| Price lists | `/api/price-lists` | |
| Quotes | `/api/quotes` | |
| Warehouse | `/api/warehouse` | |
| Marketing | `/api/marketing` | |
| Mail | `/api/mail` | IMAP/SMTP интеграция |
| Notifications | `/api/notifications` | список, `/:id/read`, `/read-all`, `DELETE /:id` |
| Dashboard | `/api/dashboard` | |
| Reports | `/api/reports` | см. ниже |
| Registry | `/api/registry` | реестры |
| Templates | `/api/templates` | шаблоны документов |
| Trash | `/api/trash` | корзина |
| Search | `/api/search` | глобальный поиск |
| References | `/api/references` | справочники |
| Comments | `/api/comments` | |
| Chats | `/api/chats` | |
| Quick actions | `/api/quick-actions` | |
| Enrichment | `/api/enrichment` | обогащение данных |
| Logs | `/api/logs` | журналы |
| Backup | `/api/backup` | бэкап/восстановление |

### Reports (`/api/reports`)
- `GET /api/reports/preview?reportType=...&page=&limit=&sortBy=&sortDir=` — предпросмотр отчёта
- `GET /api/reports/finance/...` — финансовые отчёты
- `GET /api/reports/projects/summary | tasks-by-status | budget | stages`
- `GET /api/reports/contractors/activity | debts | contracts`
- `GET /api/reports/lawyers/performance | workload`
- `GET /api/reports/tasks/workload | overdue`
- `GET /api/reports/configs` — конфигурации отчётов
- `POST /api/reports/export` — экспорт в CSV/PDF

### Documents (`/api/documents`)
- `GET /api/documents`, `GET /api/documents/stats`, `GET /api/documents/path/:id`
- `POST /api/documents/upload` (multipart/form-data), `POST /api/documents/folder`
- `PATCH /api/documents/:id/star`, `PATCH /api/documents/:id/template`
- `POST /api/documents/bulk-move`, `POST /api/documents/bulk-rename`, `POST /api/documents/restore`
- `POST /api/documents/delete`, `POST /api/documents/trash/delete`, `POST /api/documents/trash/clear`
- `GET /api/documents/download/:id`, `GET /api/documents/:id/versions`, `GET /api/documents/share/:id`

## Error Handling
Эндпоинты возвращают ошибку в простом формате:
```json
{ "error": "Human readable error message" }
```
Необработанные ошибки перехватываются глобальным обработчиком и возвращают `500` с `{ "error": "Internal Server Error" }` (подробности пишутся в лог).

## Common HTTP Status Codes
- 200 OK - Successful GET, PUT, PATCH requests
- 201 Created - Successful POST requests
- 204 No Content - Successful DELETE requests
- 400 Bad Request - Invalid request parameters
- 401 Unauthorized - Authentication required
- 403 Forbidden - Insufficient permissions / заблокированный аккаунт
- 404 Not Found - Resource not found
- 500 Internal Server Error - Server-side error

## Pagination
Списковые эндпоинты поддерживают `page` / `limit` в query-параметрах:
`GET /api/reports/preview?reportType=...&page=1&limit=10`

## Filtering and Sorting
Фильтрация и сортировка через query-параметры (`sortBy`, `sortDir`, фильтры отчётов).

## File Uploads
Загрузка файлов использует multipart/form-data (лимит тела запроса — 10mb):
```
POST /api/documents/upload
Content-Type: multipart/form-data
```
