# Тест проверки i18n ключей

## Описание

Тест `i18n-missing-keys.test.ts` автоматически сканирует весь код frontend на наличие отсутствующих ключей локализации и создаёт подробный отчёт о проблемах.

## Запуск

### Через npm:
```bash
npm run i18n:check
```

### Или напрямую через vitest:
```bash
npm run test -- src/__tests__/i18n-missing-keys.test.ts
```

## Что делает тест

1. **Сканирует файлы переводов** в `src/lib/i18n/locales/ru/` и собирает все доступные ключи
2. **Сканирует весь исходный код** в `src/` на использование `t('key')` или `t("key")`
3. **Сравнивает** используемые ключи с доступными
4. **Сохраняет отчёт** в `missing-i18n-report.json` с указанием:
   - Файла где используется ключ
   - Номера строки
   - Контекста (код вокруг ключа)
   - Времени генерации отчёта

## Формат отчёта

Отчёт сохраняется в `frontend/missing-i18n-report.json`:

```json
{
  "generated_at": "2026-05-28T13:06:11.495Z",
  "total_missing_keys": 3251,
  "total_files_with_issues": 266,
  "missing_keys_by_file": {
    "/path/to/file.tsx": [
      {
        "key": "generated.protsessy",
        "line": 52,
        "context": "<PlaceholderPage title={t('generated.protsessy')} />",
        "file": "/path/to/file.tsx"
      }
    ]
  },
  "dynamic_keys": []
}
```

## Поля отчёта

- `generated_at` - время создания отчёта
- `total_missing_keys` - общее количество отсутствующих ключей
- `total_files_with_issues` - количество файлов с проблемами
- `missing_keys_by_file` - детализация по файлам:
  - `key` - отсутствующий ключ i18n
  - `line` - номер строки в файле
  - `context` - код вокруг проблемы
  - `file` - полный путь к файлу
- `dynamic_keys` - динамические ключи (с `${}`), требуют ручной проверки

## Добавление отсутствующих ключей

Для добавления отсутствующих ключей в файлы переводов:

1. **Автоматически** (сканирует и добавляет в правильные файлы):
   ```bash
   npm run i18n:scan
   npm run i18n:fix
   ```

2. **Вручную**:
   - Откройте `missing-i18n-report.json`
   - Найдите ключ в отчёте
   - Добавьте перевод в соответствующий файл в `src/lib/i18n/locales/ru/`:
     - `common.ts` - общие слова
     - `business.ts` - бизнес сущности
     - `legal.ts` - юридический блок
     - `office.ts` - почта, документы, календарь
     - `settings.ts` - настройки
     - `components.ts` - UI компоненты
     - `general.ts` - уведомления, ошибки

## Пример добавления ключа

Если в отчёте есть:
```json
{
  "key": "generated.new_button",
  "line": 52,
  "file": "src/components/Button.tsx"
}
```

Добавьте в `src/lib/i18n/locales/ru/common.ts`:
```typescript
export const common = {
  // ...
  new_button: "Новая кнопка",
  // ...
};
```

## Интеграция в CI/CD

Тест можно запускать как часть pipeline:

```yaml
# .github/workflows/test.yml
- name: Run i18n check
  run: npm run i18n:check
```

Тест завершится ошибкой (exit code 1), если найдены отсутствующие ключи.

## Скрипты

| Команда | Описание |
|---------|----------|
| `npm run i18n:check` | Проверка отсутствующих ключей (тест) |
| `npm run i18n:scan` | Сканирование кода на новые строки |
| `npm run i18n:fix` | Автоматическое добавление ключей |
| `npm run i18n:verify` | Проверка через Node.js скрипт |

## Примечания

- Тест пропускает динамические ключи с `${}` (требуют ручной проверки)
- Исключены директории: `node_modules`, `dist`, `__tests__`, `coverage`, `lib`
- Поддерживаются все формы вызова: `t('key')`, `t("key")`, `t\`key\``
- Отчёт пересоздаётся при каждом запуске
