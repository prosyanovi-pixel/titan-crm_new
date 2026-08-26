# Подмодуль Statements (Банковские выписки)

**Версия:** 2.0  
**Дата:** 27 марта 2026  
**Статус:** ✅ Рефакторинг завершён

---

## 📐 Архитектура

```
backend/modules/finance/
├── statements.js                       # Главный экспорт
├── controllers/
│   └── statements.js                   # HTTP контроллер (192 строки)
├── services/
│   ├── statements.js                   # Бизнес-логика импорта (260 строк)
│   └── statementReconciliation.js      # Сверка со счетами (180 строк)
├── statementHelpers/                   # Вспомогательные функции
│   ├── index.js                        # Экспорты
│   ├── legalFormParser.js              # Парсинг правовых форм
│   ├── categoryDetector.js             # Определение категорий
│   ├── contractorProcessor.js          # Обработка контрагентов
│   └── reportGenerator.js              # Генерация отчётов
├── parsers.js                          # Парсеры 1C/CVS
└── utils.js                            # Общие утилиты
```

---

## 📊 Метрики рефакторинга

**До рефакторинга:**
```
statements.js - 377 строк (единый файл)
```

**После рефакторинга:**
```
controllers/statements.js       - 192 строки  (-49%)
services/statements.js          - 260 строк   ✨ NEW
services/statementReconciliation.js - 180 строк   ✨ NEW
statements.js (главный)         - 14 строк    ✨ NEW
```

**Итого:** 646 строк (увеличение на 269 строк за счёт разделения и документации)

---

## 🎯 Разделение ответственности

### controllers/statements.js (192 строки)
**Ответственность:** Обработка HTTP-запросов

**Функции:**
- `getAll()` — GET /statements
- `getLines()` — GET /statements/:id/lines
- `importStatement()` — POST /statements/import
- `reconcile()` — POST /statements/:id/reconcile
- `updateLine()` — PUT /statements/lines/:lineId
- `remove()` — DELETE /statements/:id

---

### services/statements.js (260 строк)
**Ответственность:** Бизнес-логика импорта и обработки

**Функции:**
- `getAllStatements()` — Получить все выписки
- `getStatementById(id)` — Получить выписку по ID
- `getStatementLines(statementId)` — Получить строки выписки
- `parseStatementContent(content, importType)` — Распарсить контент
- `createImportPreview(parsedLines, options)` — Создать превью
- `createStatement(statementData, userId)` — Создать выписку в БД
- `processStatementLine(line, stmtId, userId)` — Обработать строку
- `processPayment(line, contractorId, lineId, userId)` — Создать платёж
- `deleteStatement(id)` — Удалить выписку

---

### services/statementReconciliation.js (180 строк)
**Ответственность:** Сверка со счетами и платежами

**Функции:**
- `autoReconcile(statementId, account)` — Автоматическая сверка
- `assignLine(lineId, assignment, userId)` — Ручное назначение
- `createPaymentForInvoice(...)` — Создать платёж для счёта
- `createPaymentByCategory(...)` — Создать платёж по категории

---

## 🚀 API Endpoints

| Метод | Endpoint | Описание |
|-------|----------|----------|
| `GET` | `/api/finance/statements` | Список выписок |
| `GET` | `/api/finance/statements/:id/lines` | Строки выписки |
| `POST` | `/api/finance/statements/import` | Импорт выписки |
| `POST` | `/api/finance/statements/:id/reconcile` | Автосверка |
| `PUT` | `/api/finance/statements/lines/:lineId` | Ручное назначение |
| `DELETE` | `/api/finance/statements/:id` | Удалить выписку |

---

## 📝 Примеры использования

### Импорт выписки (CSV)

```javascript
POST /api/finance/statements/import
Content-Type: application/json

{
  "content": "Дата;Сумма;Направление;Контрагент;Назначение\n27.03.2026;100000;Приход;ООО Ромашка;Оплата за услуги",
  "fileName": "statement.csv",
  "importType": "csv",
  "account": "40702810001990005180"
}
```

**Ответ:**
```json
{
  "mode": "imported",
  "statementId": "stmt-1711555200000-123",
  "linesCount": 1,
  "totalCredit": 100000,
  "totalDebit": 0,
  "contractorsCreated": 1,
  "paymentsCreated": 1,
  "report": { ... }
}
```

---

### Draft mode (превью)

```javascript
POST /api/finance/statements/import
Content-Type: application/json

{
  "content": "...",
  "draft": true
}
```

**Ответ:**
```json
{
  "mode": "preview",
  "preview": {
    "fileName": "statement.csv",
    "importType": "csv",
    "linesCount": 10,
    "totalCredit": 500000,
    "totalDebit": 300000,
    "lines": [...],
    "summary": {
      "incomeCount": 7,
      "expenseCount": 3,
      "uniqueContractors": 5
    }
  }
}
```

---

### Автоматическая сверка

```javascript
POST /api/finance/statements/stmt-123/reconcile
Content-Type: application/json

{
  "account": "40702810001990005180"
}
```

**Ответ:**
```json
{
  "matched": 5,
  "total": 10
}
```

---

### Ручное назначение счёта

```javascript
PUT /api/finance/statements/lines/stl-123
Content-Type: application/json

{
  "invoiceId": "inv-456",
  "categoryId": "cat-789"
}
```

---

## 🔄 Процесс импорта выписки

```
1. POST /import
   ↓
2. parseStatementContent() → parsedLines
   ↓
3. createStatement() → stmtId в БД
   ↓
4. Для каждой строки:
   ├─ upsertContractor() → контрагент
   ├─ detectCategory() → категория
   ├─ processPayment() → платёж (если нет дубликата)
   └─ INSERT в finance_statement_lines
   ↓
5. generateImportReport() → отчёт
   ↓
6. Ответ клиенту
```

---

## 🧠 Алгоритм обработки контрагента

```javascript
upsertContractor(line):
1. Поиск по ИНН
   ├─ Найден → обновление данных
   └─ Не найден → поиск по названию
       ├─ Найден → обновление + добавление счёта
       └─ Не найден → создание нового контрагента + счёта
```

**Результат:**
```javascript
{
  contractorId: '123',
  contractorName: 'ООО "Ромашка"',
  isNew: false,
  isUpdated: true,
  newAccountAdded: true,
  changes: ['Обновлено полное название'],
  warnings: []
}
```

---

## 🎯 Определение категории

```javascript
detectCategory(purpose, direction, counterparty):

'Оплата за услуги' + 'credit' + 'ООО'  → 'inc_clients'
'НДС за квартал' + 'debit' + 'ФНС'     → 'exp_taxes'
'Зарплата за март' + 'debit' + ''      → 'exp_salary'
'Аренда офиса' + 'debit' + ''          → 'exp_rent'
'Закупка товаров' + 'debit' + 'ООО'    → 'exp_purchase'
```

---

## 📊 Статистика импорта

**Отчёт (`generateImportReport`):**
```json
{
  "summary": {
    "totalLines": 61,
    "totalCredit": 3511337.53,
    "totalDebit": 4205276.08,
    "paymentsCreated": 46,
    "duplicatesSkipped": 15
  },
  "contractors": {
    "total": 20,
    "new": 3,
    "updated": 5,
    "newAccounts": 2
  },
  "newContractors": [...],
  "updatedContractors": [...],
  "newAccounts": [...],
  "warnings": [...],
  "suggestions": [...]
}
```

---

## 🧪 Тестирование

### Проверка синтаксиса

```bash
cd backend
node -c modules/finance/services/statements.js
node -c modules/finance/services/statementReconciliation.js
node -c modules/finance/controllers/statements.js
```

### Тест API

```bash
# Получить все выписки
curl http://localhost:5001/api/finance/statements

# Импорт CSV (превью)
curl -X POST http://localhost:5001/api/finance/statements/import \
  -H "Content-Type: application/json" \
  -d '{"content":"Дата;Сумма;Направление\n27.03.2026;100000;Приход","draft":true}'

# Автосверка
curl -X POST http://localhost:5001/api/finance/statements/stmt-123/reconcile
```

---

## 🎯 Преимущества рефакторинга

### 1. **Разделение ответственности**
- **controllers**: Только HTTP
- **services/statements**: Импорт и обработка
- **services/reconciliation**: Сверка и назначения

### 2. **Легче тестировать**
```javascript
const { parseStatementContent } = require('./services/statements');
const lines = parseStatementContent('Дата;Сумма\n27.03.2026;100000', 'csv');
expect(lines).toHaveLength(1);

const { autoReconcile } = require('./services/statementReconciliation');
const result = await autoReconcile('stmt-123');
expect(result.matched).toBeGreaterThan(0);
```

### 3. **Повторное использование**
```javascript
// Можно использовать сервисы в других местах
const { createImportPreview } = require('./services/statements');
const preview = createImportPreview(parsedLines, options);
```

### 4. **Читаемость**
- Файлы ≤260 строк вместо 377
- Ясные имена функций
- Меньше вложенности

---

## 📚 Зависимости

### Внешние:
- `pg` — PostgreSQL

### Внутренние:
- `statementHelpers/` — обработка контрагентов, категории, отчёты
- `parsers.js` — парсеры 1C/CSV
- `utils.js` — общие утилиты
- `invoices.js` — пересчёт счетов

---

## 🔐 Безопасность

### Проверка данных:
- ✅ Валидация контента выписки
- ✅ Проверка на дубликаты платежей
- ✅ Транзакции для массовых операций

### SQL-инъекции:
- ✅ Параметризованные запросы
- ✅ Валидация входных данных

---

## 🐛 Известные проблемы

| Проблема | Статус | Решение |
|----------|--------|---------|
| Дубликаты платежей | ⚠️ | Проверка по сумме + дате + контрагенту |
| Ошибки парсинга 1C | ⚠️ | Логирование предупреждений |

---

## 📈 Планы развития

- [ ] Добавить поддержку других форматов (MT940, EDI)
- [ ] Реализовать массовую сверку нескольких выписок
- [ ] Добавить уведомления о расхождениях
- [ ] Экспорт отчётов в Excel/PDF
- [ ] Интеграция с онлайн-банками (API)

---

**Рефакторинг завершён успешно!** 🎉
