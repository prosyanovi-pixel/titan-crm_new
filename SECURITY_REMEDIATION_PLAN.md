# 🔐 TITAN CRM — План исправления уязвимостей безопасности

**Дата аудита:** 10.08.2026
**Статус:** план согласован, правки НЕ внесены

---

## Оглавление

1. [Сводка](#сводка)
2. [Критические уязвимости](#критические-уязвимости)
3. [Высокие уязвимости](#высокие-уязвимости)
4. [Средние / низкие](#средние--низкие)
5. [План исправления](#план-исправления)
   - [Фаза 1 — Критические (немедленно)](#фаза-1--критические-немедленно)
   - [Фаза 2 — Высокие (1–2 спринта)](#фаза-2--высокие-1-2-спринта)
   - [Фаза 3 — Средние (плановая)](#фаза-3--средние-плановая)
   - [Быстрые победы](#быстрые-победы)
6. [Критерии приёмки](#критерии-приёмки)
7. [Ответственные и сроки](#ответственные-и-сроки)

---

## Сводка

| Уровень | Кол-во | Риск |
|---------|--------|------|
| 🔴 Критический | 5 | Полная компрометация БД и сервера без аутентификации |
| 🟠 Высокий | 7 | Кража сессий, подбор паролей, утечка данных |
| 🟡 Средний / низкий | 5 | Частичные инъекции, утечки в логах, устаревшие зависимости |

**Ключевой вывод:** текущая модель авторизации позволяет **любому запросу без токена** действовать от имени администратора. Бэкенд нельзя выкатывать в production до выполнения Фазы 1.

---

## Критические уязвимости

### C1. Полный обход авторизации — `checkPermission` доверяет заголовку `x-user-id`

**Файл:** `backend/middleware/checkPermission.js:56`

```js
// Fallback для разработки (если не передан Bearer токен)
userId = req.headers['x-user-id'] || '2';   // '2' = admin
```

При отсутствии `Authorization` middleware сам назначает пользователя из подделываемого заголовка `x-user-id` (по умолчанию id `2` = админ). **Любой** запрос без токена обрабатывается как запрос администратора на каждом эндпоинте, защищённом `checkPermission`.

Дополнительно:
- `backend/middleware/auth.js:30` — принимает `mock_token_<id>` как валидную аутентификацию (подделка личности любого пользователя).
- `backend/middleware/auth.js:11` — `DISABLE_AUTH=true` полностью отключает аутентификацию.
- `req.headers['x-user-id']` используется для идентификации в **147 местах** кода (profile, mail, notifications, templates, workflow, users и др.).
- `req.headers['x-user-name']` также подделывается (`backend/modules/templates/controllers/documentController.js:72`).

### C2. WebSocket без аутентификации

**Файл:** `backend/modules/notifications/services/websocketServer.js:55`

Подключение по `?userId=<id>` без проверки токена. Любой может читать чужие уведомления, статусы почты и синхронизации.

### C3. Бэкапы без аутентификации — полный доступ к БД

**Файл:** `backend/modules/backup/routes.js` (ни одного middleware)

| Метод | Эндпоинт | Риск |
|-------|----------|------|
| `GET` | `/api/backup/download/:file` | Скачивание дампа всей БД (хэши паролей, SMTP-конфиг, все данные) |
| `POST` | `/api/backup/restore` | Выполнение произвольного SQL через `psql` (фактически RCE над БД) |
| `POST` | `/api/backup/create` / `/api/backup/full` | DoS, расход ресурсов |
| `DELETE` | `/api/backup/:file` | Уничтожение резервных копий |

### C4. Неаутентифицированные критические роуты

| Роут | Файл | Что доступно |
|------|------|--------------|
| `/api/admin/system/*` | `backend/modules/administration/routes/admin/system.js` | Чтение/удаление логов, `VACUUM ANALYZE`, `sync-modules`, `env-info`, `cache/clear` |
| `/api/settings/*` | `backend/modules/settings/routes.js` | Статусы, теги, приоритеты, project-stages, reference-data |
| `/api/system-settings` | `backend/modules/settings/routes/systemSettings.js` | Настройки системы |
| `/api/user-settings` | `backend/modules/settings/routes/userSettings.js` | Настройки пользователя |
| `/api/module-settings` | `backend/modules/settings/routes/moduleSettings.js` | Настройки модулей (включая API-ключи интеграций) |
| `/api/search` | `backend/modules/search/routes.js` | Поиск по всем данным (checkPermission импортирован, но не применён) |
| `/uploads/*` | `backend/utils/appComposition.js:43` | Все загруженные файлы (аватары, документы, вложения почты) без проверок |

### C5. Path traversal — чтение любых файлов сервера

**Файл:** `backend/utils/appComposition.js:45-58`

```js
app.get('/api/files/legal-cases/:filename', ...)  // БЕЗ auth
let filePath = path.join(__dirname, '../uploads/legal-cases', filename);
```

`GET /api/files/legal-cases/../../../../etc/passwd` → `path.join` нормализует путь за пределы uploads → `res.sendFile` отдаёт `/etc/passwd` (или любой файл, доступный процессу). Роут не защищён аутентификацией.

---

## Высокие уязвимости

### H1. Нет rate limiting
- `backend/modules/auth/routes.js` — логин/`forgot-password`/`reset-password` без ограничения попыток.
- В `docs/LOGIN_CREDENTIALS.md` заявлено «5 попыток/15 мин», но реализация отсутствует.
- Пароли всех тестовых пользователей = `password123` → подбор тривиален.

### H2. Слабый токен сброса пароля
- `backend/modules/auth/services/authService.js:158` — `Math.random().toString(36) + Date.now()` (предсказуем).
- Минимальная длина пароля — 6 символов (`authService.js:202`).

### H3. Захардкоженный JWT_SECRET
- Fallback `'titan-crm-secret-key-2026'` в файлах:
  - `backend/middleware/auth.js:4`
  - `backend/middleware/checkPermission.js:5`
  - `backend/modules/auth/services/authService.js:10`
- `backend/env` (закоммичен в git) содержит placeholder `change_this_secret_key_to_something_secure`.
- Зная секрет, можно подделать токены любого пользователя (включая admin).

### H4. Токен в localStorage и query string
- `frontend/src/lib/api.ts:11` — JWT хранится в `localStorage` → XSS приводит к краже сессии.
- `backend/middleware/auth.js:22` — `req.query.token` (токен в URL) → утечка через логи, referrer, прокси.

### H5. CORS полностью открыт + нет security headers
- `backend/utils/appComposition.js:31` — `app.use(cors())` (все origin).
- Нет helmet / CSP / HSTS / `X-Content-Type-Options`.

### H6. Upload без валидации типа файла
- `backend/modules/documents/controllers/documents.js:57` — `fileFilter` принимает любые файлы (HTML/SVG/JS) → stored XSS при открытии/скачивании.
- Лимит 100 МБ (`documents.js:71`).
- Вложения почты — без проверки расширений и антивируса.

### H7. Учётные данные в git
- `docs/LOGIN_CREDENTIALS.md` — реальные логины/пароли пользователей.
- `e2e/TEST_CREDENTIALS.md` — тестовые учётные данные.
- `backend/env` — закоммиченный конфиг (placeholder-секреты).

---

## Средние / низкие

### M1. SQL injection (ограниченная)
- `backend/modules/trash/routes.js:116` — `INTERVAL '${retentionDays} days'` (значение из `system_settings`, инъекция при компрометации настроек).
- Остальные dynamic-SQL за allowlist'ами (проверено: projects, tasks, contractors, marketing, reports) — требуют единой ревизии и тестов.

### M2. Уязвимые зависимости
`npm audit` (backend, `--omit=dev`): **1 critical, 5 high, 1 moderate**.

| Пакет | CVE / Advisory | Путь | Статус фикса |
|-------|----------------|------|--------------|
| `xmldom` | GHSA-h6q6-9hqw-rwfv и др. | `docxtemplater-image-module-free` | Нет фикса — нужна замена |
| `semver` (2.x) | GHSA-c2qf-rxjj-qqgw | `utf7` → `imap` | `npm audit fix` |
| `image-size` | — | `html-to-docx` | `npm audit fix --force` |

Фронтенд: `npm audit` — 0 уязвимостей.

### M3. Утечки в логах
- `backend/utils/appComposition.js:129` — логируется `req.body` (пароль при ошибке логина).
- `backend/utils/logger.js:282` — логируется `x-user-id`.

### M4. `DISABLE_AUTH=true`
- `backend/middleware/auth.js:11` — полноценный бэкдор-флаг, должен выпиливаться в production.

### M5. Command execution
- `exec/execSync` в `backend/modules/backup/services/backupService.js`, `backend/modules/backup/services/backupHelpers.js`, `backend/scripts/restore*.js`, `backend/modules/settings/services/syncScheduler.js`.
- Значения из конфига — требуют санации и использования `execFile` с массивом аргументов.

---

## План исправления

### Фаза 1 — Критические (немедленно, без релиза)

| # | Задача | Файлы | Критерий готовности |
|---|--------|-------|---------------------|
| 1.1 | Убрать fallback в `checkPermission`: при отсутствии токена → `401`, запретить `mock_token_*`, `DISABLE_AUTH` только при `NODE_ENV=test` | `backend/middleware/checkPermission.js`, `backend/middleware/auth.js` | Запрос без Bearer → `401`; `x-user-id` больше не влияет на права |
| 1.2 | Централизовать `req.user` из JWT и заменить все 147 обращений к `req.headers['x-user-id']` на `req.user.id` | все модули (`grep -rn "x-user-id" backend/modules`) | В коде не осталось обращений к `x-user-id` вне middleware |
| 1.3 | Добавить аутентификацию на: `/api/backup/*` (права `backup.*`/admin), `/api/admin/*`, `/api/settings/*`, `/api/module-settings`, `/api/system-settings`, `/api/user-settings`, `/api/search`, `/api/notifications` | `backend/modules/backup/routes.js`, `backend/modules/administration/routes/admin/system.js`, `backend/modules/settings/routes.js` и др. | Все перечисленные эндпоинты без токена возвращают `401` |
| 1.4 | WebSocket: проверять Bearer-токен при `upgrade` через `jwt.verify` | `backend/modules/notifications/services/websocketServer.js`, `backend/services/websocketServer.js` | Подключение без валидного токена → `4001` |
| 1.5 | Path traversal: валидация filename (`^[\w.-]+$`, запрет `..`), проверка реального пути через `path.resolve` + `path.relative` | `backend/utils/appComposition.js:45` | `../../etc/passwd` → `400`/`404`, не отдаёт файл |
| 1.6 | Убрать токен из query string (`req.query.token`) | `backend/middleware/auth.js:22` | Токен принимается только из заголовка |

### Фаза 2 — Высокие (1–2 спринта)

| # | Задача | Файлы | Критерий готовности |
|---|--------|-------|---------------------|
| 2.1 | Rate limiting на `/api/auth/*` (5 попыток/15 мин на IP+login), слайдинг-окно | `backend/modules/auth/routes.js`, установка `express-rate-limit` | 6-я неудачная попытка → `429` |
| 2.2 | JWT_SECRET только из env + валидация при старте (не-дефолтное значение); ротация секрета | `backend/middleware/auth.js`, `backend/middleware/checkPermission.js`, `backend/modules/auth/services/authService.js`, `backend/utils/startupPreflight.js` | Старт с дефолтным секретом → ошибка |
| 2.3 | Reset-токен: `crypto.randomBytes(32).toString('hex')`, хэш в БД; пароль ≥ 8 символов + сложность | `backend/modules/auth/services/authService.js` | Токен некриптостойкий исключён, тест на сложность пароля |
| 2.4 | Security headers: helmet, CSP, `X-Content-Type-Options: nosniff`, HSTS (за прокси) | `backend/utils/appComposition.js` | Ответы содержат security-заголовки |
| 2.5 | CORS: белый список доменов из env | `backend/utils/appComposition.js` | Запросы с чужих origin отклоняются |
| 2.6 | Upload: allowlist по mimetype + магическим байтам (не расширению); файлы с `Content-Disposition: attachment`; хранить вне публичной статики с контролем доступа | `backend/modules/documents/controllers/documents.js:57`, `backend/modules/legal_cases/config/upload.js`, `backend/modules/mail/utils/helpers.js` | HTML/SVG не загружаются, `/uploads/*` закрыт |
| 2.7 | Чистка логов от тел запросов | `backend/utils/appComposition.js:129`, `backend/utils/logger.js` | В логах нет `body` и паролей |

### Фаза 3 — Средние (плановая)

| # | Задача | Файлы | Критерий готовности |
|---|--------|-------|---------------------|
| 3.1 | SQL: параметризовать `retentionDays`; ревизия всех dynamic-SQL; добавить тесты на инъекции | `backend/modules/trash/routes.js:116`, все контроллеры с `${...}` в SQL | Нет интерполяции пользовательских данных в SQL |
| 3.2 | Зависимости: заменить `docxtemplater-image-module-free` (xmldom без фикса); `npm audit fix` для `semver`/`image-size` | `backend/package.json` | `npm audit --omit=dev` → 0 критических/высоких |
| 3.3 | Удалить секреты из git-истории (`git filter-repo`), перевести `backend/env` в `.gitignore`, оставить только `.env.example` | репо, `.gitignore`, `backend/.gitignore` | `git ls-files` не содержит env/credentials |
| 3.4 | `exec` → `execFile` с массивом аргументов; санация путей | `backend/modules/backup/services/backupService.js`, `backend/scripts/restore*.js`, `backend/modules/settings/services/syncScheduler.js` | Нет shell-интерпретации пользовательских значений |
| 3.5 | Деплой: HTTPS наобязательно, `NODE_ENV=production`, проверка checklist перед релизом | `backend/utils/startupPreflight.js`, документация | Чеклист выполнен |

### Быстрые победы

1. **`checkPermission`** — удалить fallback (`checkPermission.js:56`): ~5 строк, закрывает C1 частично.
2. **Auth на `/api/backup`** — 2 строки в `backup/routes.js`, закрывает C3.
3. **Path traversal** — 3 строки в `appComposition.js:45`, закрывает C5.
4. **Rate limit на логин** — 1 пакет `express-rate-limit`, закрывает H1.

---

## Критерии приёмки

1. **Авторизация:** запросы без Bearer-токена возвращают `401` на всех роутах, кроме `/api/auth/*`.
2. **Иммунитет к подделке:** отправка `x-user-id`, `x-user-name`, `mock_token_*`, `?userId=` не меняет идентичность пользователя.
3. **Path traversal:** попытка `../` не возвращает файлы за пределами каталогов загрузок.
4. **Brute-force:** после 5 неудачных входов аккаунт/IP блокируется на 15 минут.
5. **Секреты:** в репозитории нет файлов с учётными данными; `JWT_SECRET`/`ENCRYPTION_KEY` уникальны для окружения.
6. **Зависимости:** `npm audit --omit=dev` без критических/высоких (или обоснованных исключений с подтверждением, что вектор недостижим).
7. **Регрессия:** все существующие тесты (jest + Playwright) проходят; добавлены тесты на обход аутентификации, path traversal и rate limiting.

---

## Ответственные и сроки

| Фаза | Приоритет | Срок |
|------|-----------|------|
| Фаза 1 | 🔴 Блокирующая (нет выката в prod) | Немедленно |
| Фаза 2 | 🟠 В течение 1–2 спринтов | 2 недели |
| Фаза 3 | 🟡 Плановая | 1 месяц |

> ⚠️ До завершения Фазы 1 приложение не должно быть доступно в публичной сети / production.
