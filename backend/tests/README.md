# Backend Tests TITAN CRM

Эта директория содержит интеграционные и unit-тесты для backend.

## Тестовые файлы

- `finance-invoices.test.js` — Тестирование финансовых инвойсов (запускается через `npm run test:finance`)

## Запуск тестов

```bash
# Все тесты
npm test

# Только финансы
npm run test:finance
```

## Примечание

Тесты используют Node.js test runner (`node --test`), а не Jest.
