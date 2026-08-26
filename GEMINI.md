# TITAN CRM - Gemini Context

This file provides the necessary context for Gemini to understand and work effectively within the TITAN CRM codebase.

## Project Overview

TITAN CRM is a comprehensive Customer Relationship Management system built with a modern web stack. It features a modular architecture, a robust permission system, and follows strict development conventions to ensure maintainability and scalability.

### Core Technologies
- **Frontend:** React 18, Vite, TypeScript, Tailwind CSS, Shadcn UI, Radix UI, TanStack Query.
- **Backend:** Node.js, Express, PostgreSQL (`pg` library), WebSockets (`ws`), IMAP/SMTP for mail integration.
- **Testing:** Playwright (E2E), Vitest (Frontend), Jest (Backend/Integration).
- **Infrastructure:** Environment-based configuration, structured logging, backup/restore utilities.

---

## Architectural Principles

### 1. Module Boundaries (Frontend)
Feature modules located in `frontend/src/modules/` must be independent.
- **Strict Isolation:** Modules should not import directly from other feature modules (except for `contractors`, which is a core domain).
- **Public API:** Each module must export its public interface via `index.ts`.
- **Orchestration:** Cross-feature UI components and logic should reside in the app-level orchestration layer (`src/routes/*`).
- **ESLint Enforcement:** Boundaries are enforced via `no-restricted-imports`.

### 2. Permissions System
A centralized permission system controls access at both UI and API levels.
- **Constants:** Defined in `frontend/src/constants/permissions.ts`.
- **UI Check:** Use the `usePermission` hook, or `<Can>` / `<Cannot>` components.
- **API Check:** Use the `checkPermission` middleware in Express routes.
- **Admin Bypass:** Users with the `admin` role and `*` permission bypass all checks.

### 3. Internationalization (i18n)
- **Zero Hardcoded Russian:** All user-facing text must use i18n keys.
- **Location:** Translation files are in `frontend/src/lib/i18n/locales/ru/`.
- **Usage:** Use the `useTranslation` hook in React components.

---

## Development Workflow

### Key Commands

#### Root
- `npm test`: Run backend/integration tests.
- `npm run test:e2e`: Run Playwright E2E tests.

#### Backend
- `npm run dev`: Start backend with `nodemon`.
- `npm run migrate`: Apply database migrations.
- `npm run seed:all`: Seed the database with reference data and permissions.
- `npm run sync:modules`: Sync frontend module manifests with the backend.
- `npm run backup`: Create a database backup.

#### Frontend
- `npm run dev`: Start Vite development server.
- `npm run build`: Build for production.
- `npm run lint`: Run ESLint.
- `npm run test`: Run Vitest unit tests.
- `npm run scan:i18n`: Scan for missing i18n keys.

---

## Coding Standards

### JSDoc & Typing
- **Mandatory Documentation:** All exported functions, components, and classes must have JSDoc comments.
- **TypeScript:** Avoid `any`; use explicit interfaces and types. Document complex types.

### Database Conventions
- **Naming:** Database columns use `snake_case`. JavaScript objects use `camelCase`.
- **Conversion:** The backend `db.js` utility automatically converts `snake_case` from DB to `camelCase` for JS consumption.

### UI/UX
- **Shadcn UI:** Prefer existing Shadcn components for consistency.
- **Modals/Sheets:** Use the orchestration pattern for cross-module forms.

---

## Key Files & Directories

- `docs/`: Comprehensive documentation (Architecture, Development Rules, Roadmap).
- `backend/index.js`: Main entry point for the API server.
- `backend/db.js`: Database connection pool and utilities.
- `frontend/src/modules/`: Feature-specific code (Contractors, Tasks, Projects, etc.).
- `frontend/src/constants/permissions.ts`: Single source of truth for permission keys.
- `backend/env`: Backend environment variables (DB credentials, Ports, etc.).

---

## Guidelines for Gemini

1. **Check Permissions:** When adding a new feature, always consider if a new permission is needed. Update `permissions.ts`, the i18n files, and the database seeds.
2. **Follow Module Boundaries:** Do not create circular or deep dependencies between feature modules.
3. **No Hardcoded Russian:** Always use the `t()` function for strings.
4. **Database Access:** Use the `db.query` utility in the backend, which handles snake_case to camelCase conversion.
5. **Safe Refactoring Protocol (API Integrity):**
    - **Step 1: Inventory (Link Analysis):** Before modifying backend endpoints, search `frontend/src` and `backend/tests` for all occurrences of the endpoint strings (e.g., `/api/statuses`, `/api/admin`, `api.get('...`). Use `grep_search` to identify potential breakages.
    - **Step 2: Legacy First (Compatibility):** When moving endpoints to modules (e.g., `/api/users` -> `/api/administration/users`), always implement an alias or redirect in `index.js` to maintain frontend compatibility.
    - **Step 3: Automated Validation (Smoke Tests):** Verify critical endpoints return `200 OK` after any refactoring using automated scripts or `check-routes` tests. If a 404 is returned, the compatibility layer is missing.
    - **Step 4: Centralized API Map:** Favor using a centralized API map on the frontend to minimize string-based dependencies and simplify future refactoring.
6. **Refer to Docs:** If unsure, check `docs/ARCHITECTURE.md` or `docs/DEVELOPMENT_RULES.md` first.
7. **Tests:** New features must include relevant tests (Vitest for logic, Playwright for flows).
8. **Self-Review:** Before finishing any task, conduct a thorough syntax and logic check of all changed files to prevent compilation/runtime errors (e.g., redundant brackets or misplaced return statements).
9. **Specialized Agent Roles:** When approaching tasks, align with these specialized roles:
    - **Frontend Specialist:** React+TS modules, UI bugs, hooks, i18n, Tailwind/Shadcn.
    - **Implementer:** E2E features, backend refactoring, complex workflows, schema changes.
    - **Migration Engineer:** PostgreSQL migrations, DDL/DML patterns, data integrity.
    - **Reviewer:** Security, regression checks, architecture compliance, test coverage.
    - **Explorer:** Fast codebase navigation, pattern identification, Q&A.
10. **Temporary Scripts:** All temporary, experimental, or ad-hoc test scripts MUST be placed in the `scratch/` directory at the root of the project (e.g. `scratch/backend/`, `scratch/frontend/`). Do not clutter the root `frontend/` or `backend/` directories with one-off `.js` or `.ts` files.
11. **Tax Rates (VAT):** Always use 22% for НДС (VAT) and 20% for Налог на прибыль (Profit Tax) when implementing financial calculations, unless specified otherwise.
12. **Page Settings (Header/Actions):** When creating a new module page, NEVER render the page header/title or actions inline inside the page component. ALWAYS use the `usePageSettings` hook from `@/context/LayoutContext`. This ensures the global `AppLayout` correctly displays the header and cleans it up when navigating to another module, preventing the "ghost UI" issue.
13. **Strict i18n (Zero Russian):** You MUST NOT use Russian text in the UI code. When you need to display text, ALWAYS create new keys in `frontend/src/lib/i18n/locales/ru/*.json` and use them. 
14. **Correct i18n Fallback Syntax:** NEVER use JavaScript logical OR inside the `t()` function call (e.g. `t('key' || 'текст')`). This is a syntax error that evaluates to `t('key')` anyway. If you must use a fallback for debugging, use `t('key', 'текст')` or `{t('key')} /* текст */`.
