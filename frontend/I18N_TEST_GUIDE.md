# Проверка i18n переводов

В проекте используются автоматизированные тесты для проверки отсутствия отсутствующих ключей локализации.

## Быстрый старт

### Запустить проверку
```bash
cd frontend
npm run i18n:check
```

### Просмотр результатов
```bash
# Краткая статистика
node scripts/view-i18n-report.js

# Детали по конкретному файлу
node scripts/view-i18n-report.js --file src/components/Button.tsx

# Поиск по ключу
node scripts/view-i18n-report.js --key generated.save_button

# Список всех файлов с проблемами
node scripts/view-i18n-report.js --list
```

## Что делает тест

Тест `src/__tests__/i18n-missing-keys.test.ts`:
- Сканирует все файлы переводов в `src/lib/i18n/locales/ru/`
- Находит все использования `t('key')` в коде
- Сравнивает и находит отсутствующие ключи
- Сохраняет подробный отчёт в `missing-i18n-report.json`

## Отчёт

Отчёт содержит:
- Время генерации
- Общее количество пропущенных ключей
- Количество файлов с проблемами
- Детализацию по каждому файлу:
  - Ключ
  - Номер строки
  - Контекст кода

## Добавление переводов

1. Запустите проверку: `npm run i18n:check`
2. Посмотрите отчёт: `node scripts/view-i18n-report.js`
3. Добавьте недостающие ключи в соответствующие файлы:
   - `src/lib/i18n/locales/ru/common.ts` - общие слова
   - `src/lib/i18n/locales/ru/business.ts` - бизнес сущности
   - `src/lib/i18n/locales/ru/legal.ts` - юридический блок
   - `src/lib/i18n/locales/ru/office.ts` - почта, документы
   - `src/lib/i18n/locales/ru/settings.ts` - настройки
   - `src/lib/i18n/locales/ru/components.ts` - UI компоненты
   - `src/lib/i18n/locales/ru/general.ts` - уведомления

## Дополнительные команды

```bash
# Сканирование кода на новые строки
npm run i18n:scan

# Автоматическое добавление ключей
npm run i18n:fix

# Проверка через Node.js скрипт
npm run i18n:verify
```

## CI/CD

Тест можно включать в pipeline:
```yaml
- name: Check i18n keys
  run: npm run i18n:check
```

Тест завершится ошибкой если найдены отсутствующие ключи.

## Документация

Полная документация: `src/__tests__/README_I18N_TEST.md`
