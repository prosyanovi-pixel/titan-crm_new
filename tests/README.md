# Тесты TITAN CRM

Эта директория содержит тестовые файлы для ручного и интеграционного тестирования.

## Структура

- `test-frontend-api.js` - Тестирование API frontend
- `test-imap-sync.js` - Тестирование синхронизации IMAP
- `test-integration.js` - Интеграционные тесты
- `test-nan.js` - Тестирование обработки NaN значений
- `test_login.html` - HTML тест для логина

## E2E тесты

E2E тесты находятся в отдельной директории `e2e/` в корне проекта и используют Playwright.

## Unit тесты

- **Frontend**: Vitest - находятся в `frontend/src/**/__tests__/**`
- **Backend**: Node.js test runner - находятся в `backend/tests/`

## Запуск тестов

```bash
# E2E тесты
npm run test:e2e

# Frontend unit тесты
cd frontend && npm run test

# Backend unit тесты
cd backend && npm run test
```
