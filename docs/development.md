# Development Guide

## Project Structure

### Frontend (`frontend/`) — React 18 + Vite + TypeScript + Tailwind CSS
- `src/components/` - Reusable UI components (Shadcn/Radix)
- `src/modules/` - Module-specific components and logic (см. `src/modules/STANDARD.md`)
- `src/api/` - API-слой и тесты к нему
- `src/lib/` - Утилиты, i18n (`src/lib/i18n/`), сервисы (`src/lib/services/`), типы
- `src/hooks/` - Custom React hooks (usePermission, useDataTable и др.)
- `src/context/` - React-контексты (LayoutContext и др.)
- `src/constants/` - Константы, включая `permissions.ts`
- `src/routes.tsx` - Слой оркестрации и маршрутизации

### Backend (`backend/`) — Node.js + Express + PostgreSQL (`pg`)
- `index.js` - Точка входа Express-сервера
- `routes/` - API route definitions
- `modules/` - Модульная структура backend (контроллеры + роуты по модулям)
- `middleware/` - Express middleware (аутентификация, `checkPermission` и др.)
- `services/` - Business logic services
- `db.js` - Доступ к БД (авто-конверсия snake_case <-> camelCase), работать через `db.query`
- `migrations/` - Миграции схемы БД (`npm run migrate`)
- `seeds/` и `scripts/` - Сид-данные и утилитарные скрипты (backup, sync:modules и др.)

## Build Process
1. Frontend: `npm --prefix frontend run build` (компиляция TypeScript + Vite build)
2. Frontend: `npm --prefix frontend run lint` для проверки кода
3. Тесты: `npm test` (интеграционные тесты backend, Jest), `npm --prefix frontend run test` (Vitest), `npm run test:e2e` (Playwright)

## Deployment
1. Build production artifacts (`npm --prefix frontend run build`)
2. Deploy to staging environment
3. Run end-to-end tests
4. Deploy to production

## Environment Variables
- `backend/env` и `backend/env.example` - Конфигурация backend
- `frontend/.env` - Конфигурация frontend

## Security Considerations
- All API routes require authentication
- Input validation on all endpoints
- Secure password hashing (bcrypt)
- Проверка прав доступа через middleware `checkPermission` (роль `admin` с правом `*` обходит проверки)