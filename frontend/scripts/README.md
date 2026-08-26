# Frontend Scripts TITAN CRM

Эта директория содержит production-скрипты из `package.json`.

## Scripts (из package.json)

### i18n
| Script | Command | Description |
|--------|---------|-------------|
| `scan-i18n.js` | `npm run scan:i18n` | Сканирование i18n ключей |
| `validate-module-seeds.js` | `npm run validate:module-seeds` | Валидация сидов модулей |

### Branding & Assets
| Script | Command | Description |
|--------|---------|-------------|
| `generate-brand.js` | `npm run generate:brand` | Генерация брендовых assets |
| `generate-icons.js` | `npm run generate:icons` | Генерация иконок |

### Documentation
- `I18N_INSTRUCTIONS.md` — Инструкция по интернационализации

## ⚠️ Важно

**НЕ добавляйте** сюда:
- ❌ Debug/fix скрипты для i18n → `../archive/`
- ❌ Временные скрипты → `../archive/`
- ❌ Сгенерированные файлы → `../archive/`
