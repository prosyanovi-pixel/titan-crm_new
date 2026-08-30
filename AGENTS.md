# TITAN CRM - Specialized Agents

This document describes the specialized agents available to assist with TITAN CRM development. Use these agents via the Copilot chat command `/subagent` for focused, expert help on specific tasks.

## Language Requirements (Обязательный язык ответов)

> **ВСЕ ответы агентов пользователю ДОЛЖНЫ быть на русском языке.**
> All agent responses to the user MUST be in Russian, regardless of the user's message language or the tool's default behavior.

1. **Язык ответов.** Каждое сообщение агента пользователю (объяснения, итоги, планы, вопросы, отчёты о проверках) пишется на русском языке. Допускается вставка английских технических терминов, имён функций, путей и команд.
2. **Код и комментарии.** Комментарии в коде, JSDoc, сообщения коммитов и миграций в этом проекте принято писать на русском языке.
3. **Идентификаторы.** Имена переменных, функций, компонентов, ключи i18n, названия пакетов и команд остаются на английском (как в коде) — переводится только пояснительный текст.
4. **Обязательность.** Правило действует для ВСЕХ агентов и субагентов: Frontend Specialist, Implementer, Migration Engineer, Reviewer, Explore — и перекрывает любые настройки или стандартные предпочтения модели.

---

## Available Agents

### 1. **TITAN CRM Frontend Specialist**
**Purpose**: Implement or fix frontend features in React+TypeScript modules

**Use when**:
- Building new features in `frontend/src/modules/`
- Fixing UI bugs or styling issues
- Working with React hooks (useQuery, useForm, custom hooks)
- Creating new components or pages
- Implementing Russian (i18n) translations for a module
- Debugging state management or TanStack Query issues
- Form validation with React Hook Form + Zod

**Example**: "Use TITAN CRM Frontend Specialist to add a new contractor list view with filtering"

**Expertise**:
- Module architecture and barrel exports
- Hook composition patterns
- React Hook Form + Zod validation
- i18n key structure and Russian translations
- Tailwind CSS and shadcn/ui components
- TanStack Query and async state management
- Testing with Vitest and React Testing Library

---

### 2. **TITAN CRM Implementer**
**Purpose**: Implement or refactor features in both frontend and backend

**Use when**:
- Working on end-to-end features (frontend + backend)
- Adding new modules that require database schema changes
- Implementing complex workflows across layers
- Refactoring existing code with tests
- Fixing bugs that span frontend/backend
- Code review and architecture validation

**Example**: "Use TITAN CRM Implementer to add a new legal case document upload feature with API integration"

**Expertise**:
- Full-stack implementation
- Module architecture (frontend + backend)
- API route design and Express controllers
- PostgreSQL queries and schema
- i18n translations (Russian)
- Testing strategy (unit + E2E)
- Error handling across layers
- Database migration planning

---

### 3. **TITAN CRM Migration Engineer**
**Purpose**: Create, review, and validate PostgreSQL database migrations

**Use when**:
- Creating database schema migrations
- Adding new tables or columns
- Refactoring database structure
- Handling zero-downtime concerns
- Reviewing migration safety and data integrity
- Planning data backfills
- Ensuring rollback safety

**Example**: "Use TITAN CRM Migration Engineer to create a migration for adding a case status tracking table"

**Expertise**:
- PostgreSQL DDL/DML patterns
- Migration file structure and versioning
- Data integrity and constraint design
- Rollback strategies
- Performance considerations
- Zero-downtime schema evolution
- Seed data management
- Transaction handling

---

### 4. **TITAN CRM Reviewer**
**Purpose**: Perform strict code review with security, regression, and architecture focus

**Use when**:
- Need pre-merge code review
- Checking for security vulnerabilities
- Validating architecture compliance
- Identifying missing tests or edge cases
- Assessing regression risk
- Reviewing refactoring for unintended side effects
- Release readiness evaluation

**Example**: "Use TITAN CRM Reviewer to review the new mail filtering feature for regressions and edge cases"

**Expertise**:
- Code quality and maintainability
- Security and data integrity concerns
- Architecture drift detection
- Test coverage analysis
- Regression risk assessment
- Performance implications
- i18n consistency
- Module boundary violations

---

### 5. **Explore** (General Purpose)
**Purpose**: Fast read-only codebase exploration and Q&A

**Use when**:
- Need to understand existing code patterns
- Searching for examples of how something is implemented
- Understanding module structure or dependencies
- Quick answers about codebase conventions
- Locating relevant files or functions
- Gathering context before implementing a feature

**Example**: "Use Explore to understand how form validation works in the contractors module"

**Options**: Specify thoroughness level
- `quick` - Fast overview
- `medium` - Detailed exploration  
- `thorough` - In-depth analysis with examples

**Expertise**:
- Fast pattern recognition
- Codebase navigation
- Convention identification
- Example finding
- Dependency analysis

---

## Critical Rules for All Agents

1.  **Отвечать на русском языке** (см. раздел Language Requirements в начале файла). Это правило обязательно для всех агентов без исключений.
2.  **Tool Usage Priority**: You are a LOCAL agent. For ANY task related to this codebase, you MUST use LOCAL tools FIRST:
    *   To explore files: Use `glob`, `grep`, `bash`, or `read`. **DO NOT use `webfetch`** for analyzing the local project.
    *   The API endpoint `https://api.github.com/repos/titan-crm/titan-crm/contents` does NOT exist and will return a 404 error. NEVER attempt to use it.
    *   All code reading, writing, and editing must be done using local file system tools.
3.  **Task Execution**: Execute tasks directly using the appropriate local tools. Do not use `webfetch` or `task` to delegate the exploration of the local project structure.

---

## Project Context (Контекст проекта)

### Core Technologies
- **Frontend:** React 18, Vite, TypeScript, Tailwind CSS, Shadcn UI, Radix UI, TanStack Query.
- **Backend:** Node.js, Express, PostgreSQL (`pg` library), WebSockets (`ws`), IMAP/SMTP для почтовой интеграции.
- **Testing:** Playwright (E2E), Vitest (Frontend), Jest (Backend/Integration).
- **Infrastructure:** конфигурация через `backend/env` и `frontend/.env`, структурированное логирование, утилиты бэкапа/восстановления.

### Architectural Principles

**Module Boundaries (frontend).** Модули в `frontend/src/modules/` независимы:
- запрещены прямые импорты между фичер-модулями (кроме `contractors` — core domain);
- каждый модуль экспортирует публичный API через `index.ts`;
- кросс-модульные UI и логика — в слое оркестрации (`src/routes/*`);
- границы enforce через ESLint `no-restricted-imports`.

**Permissions System.** Централизованная система прав:
- константы — `frontend/src/constants/permissions.ts`;
- UI-проверка — хук `usePermission` или `<Can>` / `<Cannot>`;
- API-проверка — middleware `checkPermission` в Express-роутах;
- роль `admin` с правом `*` обходит все проверки.
- При добавлении новой фичи всегда оценивайте нужность нового права и синхронизируйте `permissions.ts`, i18n и сиды БД.

**Internationalization (i18n).**
- Ноль захардкоженного русского текста в UI: весь пользовательский текст — только через ключи i18n.
- Файлы переводов: `frontend/src/lib/i18n/locales/ru/`.
- В компонентах использовать хук `useTranslation`.
- ВАЖНО: никогда не использовать логический `||` внутри `t()` (например `t('key' || 'текст')`) — это ошибка. Если нужен fallback, используйте `t('key', 'текст')` или `{t('key')} /* текст */`.
- После изменений текстов запускайте `npm run scan:i18n` для проверки полноты ключей.

### Key Commands

**Root:** `npm test` (интеграционные тесты backend), `npm run test:e2e` (Playwright).
**Backend:** `npm run dev`, `npm run migrate`, `npm run seed:all`, `npm run sync:modules`, `npm run backup`.
**Frontend:** `npm run dev`, `npm run build`, `npm run lint`, `npm run test` (Vitest), `npm run scan:i18n`.

### Coding Standards
- **JSDoc обязателен** для всех экспортируемых функций, компонентов и классов (на русском языке).
- **TypeScript:** избегать `any`; использовать явные интерфейсы/типы.
- **БД:** колонки — `snake_case`, JS-объекты — `camelCase`; конверсию делает `backend/db.js` автоматически. Работать с БД через `db.query`, а не через сырой `pg`.
- **UI/UX:** предпочитать существующие компоненты Shadcn; модалки/шейты для кросс-модульных форм — через паттерн оркестрации.
- **Page Settings:** при создании страницы модуля НИКОГДА не рендерить заголовок/экшены инлайн в компоненте — всегда использовать хук `usePageSettings` из `@/context/LayoutContext`, иначе возможен «ghost UI» при переходах между модулями.
- **Налоги (финансы):** НДС — **22%**, налог на прибыль — **20%**, если не указано иное.
- **Временные скрипты:** все одноразовые/экспериментальные скрипты класть в `scratch/` в корне проекта, не засорять `frontend/` и `backend/`.
- **Тесты:** новые фичи должны включать тесты (Vitest — логика, Playwright — сценарии).
- **Self-Review:** перед завершением задачи провести проверку синтаксиса и логики всех изменённых файлов (сборка/линт/соответствие типам), чтобы исключить ошибки вроде лишних скобок или неверных `return`.

### Documentation
- `docs/development.md` — правила разработки.
- `docs/README.md` — оглавление документации по модулям/API.
- `SAFE_REFACTORING_PROTOCOL.md` — протокол безопасного рефакторинга API (обязателен при изменении эндпоинтов).
- `wiki/` — подробное описание модулей, схемы БД, API.

---

## Engineering Guidelines for All Agents

All agents must adhere to these core principles to maintain project integrity:

### Safe Refactoring Protocol (API Integrity)
Full protocol is in `SAFE_REFACTORING_PROTOCOL.md`. Summary:
1.  **Inventory Phase**: Before modifying backend endpoints, search `frontend/src` and `backend/tests` for all occurrences of the endpoint strings (e.g., `/api/statuses`, `api.get('...`).
2.  **Legacy Compatibility**: When moving endpoints to modules (e.g., `/api/users` -> `/api/administration/users`), always implement an alias or redirect in the main `index.js` to maintain frontend compatibility.
3.  **Smoke Testing**: Verify critical endpoints return `200 OK` after any refactoring using automated scripts or manual checks.
4.  **Shared API Map**: Favor using a centralized API map (like `api-map.ts`) on the frontend to minimize string-based dependencies.

---

## When to Use Each Agent

### Task Type → Agent Mapping

| Task | Primary Agent | Secondary |
|------|---------------|-----------|
| New feature (frontend only) | Frontend Specialist | Reviewer |
| New feature (full stack) | Implementer | Migration Engineer (if DB) |
| Database schema change | Migration Engineer | Implementer |
| Bug fix | Implementer | Reviewer |
| Code review | Reviewer | Architecture-specific agent |
| Refactoring | Implementer | Reviewer |
| Testing strategy | Implementer | Reviewer |
| i18n/translations | Frontend Specialist | Implementer |
| Module structure questions | Explore | - |
| Pattern examples | Explore | - |
| Pre-merge check | Reviewer | - |

---

## Communication Tips

### For Frontend Specialist
Describe the module, component, and specific requirements:
> "Add a new 'Draft' tab to the projects list view that shows unpublished projects with a different background color"

### For Implementer
Describe the full workflow:
> "Implement a document archival feature: new 'Archive' button on documents → marks as archived in DB → hides from lists → includes API endpoint"

### For Migration Engineer
Describe schema intent and constraints:
> "Create a migration to track document approval workflow: add status enum (pending/approved/rejected), add approved_by user reference, add approval_date timestamp"

### For Reviewer
Provide context and concerns:
> "Review this contractor import feature for data validation, error handling, and edge cases like duplicate INNs"

### For Explore
Specify what you're looking for:
> "Show me how file uploads work in the documents module (thorough)"

---

## Integration with Copilot Chat

Use agents in your chat with:
```
/subagent <agent-name>
```

Or invoke directly with context:
```
/subagent TITAN CRM Frontend Specialist: Add dark mode toggle to the app header
```

All agent interactions are context-aware and can reference:
- Your current file/module
- Recent edits in the conversation
- This file (`AGENTS.md`) and `GEMINI.md` (расширенные правила для Gemini)
- `docs/development.md` и документация в `docs/`, `wiki/`
- Workspace structure and dependencies