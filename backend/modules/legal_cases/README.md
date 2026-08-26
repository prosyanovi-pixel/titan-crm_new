# Модуль Legal Cases (Юридические дела)

**Версия:** 2.0  
**Дата:** 27 марта 2026  
**Статус:** ✅ Рефакторинг завершён

---

## 📐 Архитектура

```
backend/modules/legal_cases/
├── index.js                    # Точка входа
├── settings.js                 # Настройки модуля
├── routes.js                   # Главный роутер
├── config/
│   └── upload.js               # Конфигурация загрузчика файлов
├── controllers/
│   ├── cases.js                # CRUD операций с делами
│   └── documents.js            # Управление документами
├── services/
│   ├── cases.js                # Бизнес-логика дел
│   └── documents.js            # Бизнес-логика документов
├── validators/
│   └── validators.js           # Валидация данных
└── utils/
    ├── helpers.js              # Главный экспорт утилит
    ├── utils.js                # Базовые утилиты
    ├── extractors.js           # Извлечение данных из запроса
    ├── normalizers.js          # Нормализация данных
    ├── tableManager.js         # Управление таблицами БД
    └── relations.js            # Загрузка связанных данных
```

---

## 📊 Метрики рефакторинга

| Файл | До | После | Улучшение |
|------|-----|-------|-----------|
| `controllers/documents.js` | 250 строк | 160 строк | -36% |
| `utils/helpers.js` | 251 строка | 50 строк | -80% |
| **Общая сложность** | Высокая | Средняя | ⬇️ |

### Новые файлы:

| Файл | Строк | Назначение |
|------|-------|------------|
| `services/documents.js` | 140 | Бизнес-логика документов |
| `config/upload.js` | 45 | Настройка загрузчика файлов |
| `utils/utils.js` | 55 | Базовые утилиты |
| `utils/extractors.js` | 55 | Извлечение данных |
| `utils/normalizers.js` | 45 | Нормализация данных |
| `utils/tableManager.js` | 60 | Управление таблицами |
| `utils/relations.js` | 100 | Загрузка связанных данных |

---

## 🚀 API Endpoints

### Дела (Cases)

| Метод | Endpoint | Описание |
|-------|----------|----------|
| `GET` | `/api/legal-cases/` | Получить все дела |
| `GET` | `/api/legal-cases/:id` | Получить дело по ID |
| `POST` | `/api/legal-cases/` | Создать дело |
| `PUT` | `/api/legal-cases/:id` | Обновить дело |
| `DELETE` | `/api/legal-cases/:id` | Удалить дело |

### Документы (Documents)

| Метод | Endpoint | Описание |
|-------|----------|----------|
| `GET` | `/api/legal-cases/documents/case/:caseId` | Документы дела |
| `POST` | `/api/legal-cases/documents` | Загрузить документ |
| `GET` | `/api/legal-cases/documents/files/:filename` | Получить файл |
| `DELETE` | `/api/legal-cases/documents/:id` | Удалить документ |
| `POST` | `/api/legal-cases/documents/cleanup` | Очистка файлов |

---

## 📝 Примеры использования

### Создание дела

```javascript
POST /api/legal-cases/
Content-Type: application/json

{
  "title": "Дело о нарушении авторских прав",
  "type": "civil",
  "status": "active",
  "lawyerId": "lawyer-123",
  "caseNumber": "А40-123456/2026",
  "creationDate": "2026-03-27",
  "client": "ООО «Ромашка»",
  "defendant": "ЗАО «Вектор»",
  "courtName": "Арбитражный суд Москвы",
  "price": 1000000,
  "finance": {
    "claimAmount": 1000000,
    "claimCurrency": "RUB",
    "stateDuty": 50000
  }
}
```

### Загрузка документа

```javascript
POST /api/legal-cases/documents
Content-Type: multipart/form-data

file: <файл>
case_id: case-123
name: "Исковое заявление"
type: "document"
```

---

## 🔧 Утилиты

### Базовые утилиты (`utils/utils.js`)

```javascript
const { pickFirstDefined, toNumber, cleanTextValue, cleanNumberValue, randSuffix } = require('./utils');

pickFirstDefined(undefined, null, 'value')  // → 'value'
toNumber('123.45', 0)                       // → 123.45
cleanTextValue(undefined)                   // → null
cleanNumberValue('abc', 0)                  // → 0
randSuffix()                                // → '1711555200000-xk3j9d2f1'
```

### Извлечение данных (`utils/extractors.js`)

```javascript
const { extractCasePayload } = require('./extractors');

const payload = extractCasePayload({
  title: 'Дело',
  lawyerId: '123',
  finance: { claimAmount: 1000 }
});
// → { title: 'Дело', lawyerId: '123', claimAmount: 1000, ... }
```

### Нормализация (`utils/normalizers.js`)

```javascript
const { normalizeCaseCoreFields, normalizeNote } = require('./normalizers');

normalizeCaseCoreFields({ creationdate: '2026-03-27' })
// → { creationDate: '2026-03-27' }

normalizeNote({ text: 'Заметка' })
// → { text: 'Заметка', isInternal: false }
```

### Управление таблицами (`utils/tableManager.js`)

```javascript
const { ensureLegalCaseSupportTables } = require('./tableManager');

await ensureLegalCaseSupportTables();
// Создаёт: case_events, case_third_parties, case_recovered_items, case_expenses
```

### Связанные данные (`utils/relations.js`)

```javascript
const { hydrateCaseRelations, getCaseNotesInternalColumn } = require('./relations');

await hydrateCaseRelations(caseObj);
// Добавляет: events, thirdParties, notes, documents, recoveredItems, expenses, financials

const colName = await getCaseNotesInternalColumn();
// → 'is_internal' или 'isinternal'
```

---

## 🧪 Тестирование

### Проверка синтаксиса

```bash
cd backend
node -c modules/legal_cases/index.js
node -c modules/legal_cases/controllers/documents.js
node -c modules/legal_cases/services/documents.js
```

### Тест API

```bash
# Получить все дела
curl http://localhost:5001/api/legal-cases

# Создать дело
curl -X POST http://localhost:5001/api/legal-cases \
  -H "Content-Type: application/json" \
  -d '{"title":"Тест","type":"civil","status":"active","lawyerId":"1","caseNumber":"А40-1/2026","creationDate":"2026-03-27"}'

# Загрузить документ
curl -X POST http://localhost:5001/api/legal-cases/documents \
  -F "file=@test.pdf" \
  -F "case_id=case-123" \
  -F "name=Тест" \
  -F "type=document"
```

---

## 🎯 Преимущества рефакторинга

### 1. **Разделение ответственности**
- **controllers**: Только обработка HTTP-запросов
- **services**: Только бизнес-логика
- **utils**: Только вспомогательные функции

### 2. **Легче тестировать**
```javascript
// Можно тестировать каждую функцию отдельно
const { formatFileSize } = require('./services/documents');
expect(formatFileSize(1024)).toBe('1 KB');

const { normalizeCaseCoreFields } = require('./utils/normalizers');
expect(normalizeCaseCoreFields({ creationdate: '2026' }))
  .toHaveProperty('creationDate', '2026');
```

### 3. **Повторное использование**
```javascript
// Можно использовать функции в других модулях
const { ensureLegalCaseSupportTables } = require('./utils/tableManager');
await ensureLegalCaseSupportTables();
```

### 4. **Читаемость**
- Меньше файлов → легче найти код
- Ясные имена файлов → понятно где что
- Меньше вложенности → проще читать

---

## 📚 Зависимости

### Внешние:
- `express` — веб-фреймворк
- `multer` — загрузка файлов
- `pg` — работа с PostgreSQL

### Внутренние:
- `../../../db` — подключение к БД
- `../../../utils/errorHandler` — обработка ошибок
- `../../../utils/responseHelpers` — форматирование ответов
- `../../../utils/logger` — логирование

---

## 🔐 Безопасность

### Загрузка файлов:
- ✅ Проверка типов файлов (только разрешённые расширения)
- ✅ Ограничение размера (50MB)
- ✅ Уникальные имена файлов
- ✅ Изолированная директория загрузок

### SQL-инъекции:
- ✅ Параметризованные запросы
- ✅ Валидация входных данных

---

## 🐛 Известные проблемы

| Проблема | Статус | Решение |
|----------|--------|---------|
| Кэш колонки `is_internal` | ⚠️ | Сбрасывать при миграциях |
| UTF-8 имена файлов | ✅ | Декодирование в `decodeFilename()` |

---

## 📈 Планы развития

- [ ] Добавить пагинацию для списка дел
- [ ] Реализовать поиск по делам
- [ ] Добавить экспорт дел в Excel
- [ ] Реализовать массовые операции
- [ ] Добавить аудит изменений

---

**Рефакторинг завершён успешно!** 🎉
