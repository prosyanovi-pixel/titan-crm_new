# Стандарт структуры модулей TITAN CRM Backend

**Версия:** 1.0  
**Дата:** 26.03.2026

---

## 📐 Типы модулей

### **Тип A: Простой CRUD модуль** (80% модулей)

**Примеры:** `tasks`, `calendar`, `lawyers`, `documents`, `mail`, `profile`, `registry`, `dashboard`

**Структура (4 файла):**
```
backend/modules/<module>/
├── index.js              # Точка входа (экспорт router + settings)
├── settings.js           # Настройки модуля
├── routes.js             # Маршруты Express
└── controllers.js        # Обработчики запросов + логика
```

---

### **Тип B: Сложный модуль с подмодулями** (20% модулей)

**Примеры:** `finance`, `legal_cases`

**Структура:**
```
backend/modules/<module>/
├── index.js                  # Точка входа
├── settings.js               # Настройки
├── routes.js                 # Главный роутер (подключает подмодули)
├── controllers/              # Контроллеры по сущностям
│   ├── invoices.js
│   ├── payments.js
│   └── statements.js
├── services/                 # Бизнес-логика (опционально)
│   ├── invoices.js
│   └── payments.js
└── utils/                    # Утилиты модуля (опционально)
    ├── schema.js
    └── helpers.js
```

---

## 📝 Шаблоны файлов (Тип A: Простой CRUD)

### **1. index.js**

```javascript
/**
 * Главный файл модуля <Module Name>
 * Экспортирует роутер и настройки
 */

const router = require('./routes');
const settings = require('./settings');

module.exports = {
  router,
  settings,
  prefix: '/api/<module_name>',
};
```

---

### **2. settings.js**

```javascript
/**
 * <Module Name> Module Settings
 */

module.exports = {
  display: {
    itemsPerPage: 20,
    defaultSort: 'createdAt',
    defaultView: 'list',
  },
  features: {
    enableFeature1: true,
    enableFeature2: false,
    enableFeature3: true,
  },
  defaults: {
    status: 'active',
    priority: 'medium',
  },
};
```

---

### **3. routes.js**

```javascript
/**
 * Маршруты модуля <Module Name>
 */

const express = require('express');
const router = express.Router();
const controllers = require('./controllers');

// GET /api/<module> - Получить все записи
router.get('/', controllers.getAll);

// GET /api/<module>/:id - Получить по ID
router.get('/:id', controllers.getById);

// POST /api/<module> - Создать
router.post('/', controllers.create);

// PUT /api/<module>/:id - Обновить
router.put('/:id', controllers.update);

// DELETE /api/<module>/:id - Удалить
router.delete('/:id', controllers.remove);

// POST /api/<module>/bulk-update - Массовое обновление
router.post('/bulk-update', controllers.bulkUpdate);

module.exports = router;
```

---

### **4. controllers.js**

```javascript
/**
 * Контроллеры модуля <Module Name>
 * Обработчики HTTP-запросов
 */

const { asyncHandler } = require('../../utils/errorHandler');
const { sendSuccess, sendCreated, sendNotFound, sendDeleted, sendValidationError } = require('../../utils/responseHelpers');
const db = require('../../db');

/**
 * Загрузка связанных данных (опционально)
 * @param {number} id - ID записи
 * @returns {Promise<Object>} Объект с связанными данными
 */
const loadRelations = async (id) => {
  // Пример загрузки связанных данных
  const { rows } = await db.query('SELECT * FROM related_table WHERE <module>_id = $1', [id]);
  return rows;
};

/**
 * Получить все записи
 * @route GET /api/<module>
 * @param {string} req.query.search - Поисковый запрос
 * @param {string} req.query.limit - Лимит записей
 * @returns {Array} Список записей
 */
async function getAll(req, res) {
  const { search, limit } = req.query;
  
  let query;
  let values;
  
  if (search && search.trim()) {
    const s = `%${search.trim()}%`;
    query = `SELECT * FROM <table> WHERE name ILIKE $1 ORDER BY id DESC LIMIT $2`;
    values = [s, parseInt(limit) || 50];
  } else {
    query = `SELECT * FROM <table> ORDER BY id DESC`;
    values = [];
  }
  
  const { rows } = await db.query(query, values);
  
  // Загрузка связанных данных (опционально)
  for (let item of rows) {
    item.relations = await loadRelations(item.id);
  }
  
  sendSuccess(res, rows);
}

/**
 * Получить запись по ID
 * @route GET /api/<module>/:id
 * @param {string} req.params.id - ID записи
 * @returns {Object} Запись с связанными данными
 */
async function getById(req, res) {
  const { id } = req.params;
  const { rows } = await db.query('SELECT * FROM <table> WHERE id = $1', [id]);

  if (rows.length === 0) {
    return sendNotFound(res, '<Module> not found');
  }

  const item = rows[0];
  item.relations = await loadRelations(id);
  
  sendSuccess(res, item);
}

/**
 * Создать запись
 * @route POST /api/<module>
 * @param {Object} req.body - Данные записи
 * @returns {Object} Созданная запись
 */
async function create(req, res) {
  const data = req.body;
  
  // Валидация обязательных полей
  if (!data.name || !data.title) {
    return sendValidationError(res, 'Name/Title is required');
  }
  
  const { rows } = await db.query(
    `INSERT INTO <table> (field1, field2, field3) VALUES ($1, $2, $3) RETURNING *`,
    [data.field1, data.field2, data.field3]
  );

  const item = rows[0];
  
  // Сохранение связанных данных (опционально)
  if (data.relations) {
    // Логика сохранения связанных данных
  }
  
  sendCreated(res, item);
}

/**
 * Обновить запись
 * @route PUT /api/<module>/:id
 * @param {string} req.params.id - ID записи
 * @param {Object} req.body - Обновлённые данные
 * @returns {Object} Обновлённая запись
 */
async function update(req, res) {
  const { id } = req.params;
  const data = req.body;
  
  const { rows } = await db.query(
    `UPDATE <table> SET field1 = $1, field2 = $2, field3 = $3 WHERE id = $4 RETURNING *`,
    [data.field1, data.field2, data.field3, id]
  );

  if (rows.length === 0) {
    return sendNotFound(res, '<Module> not found');
  }

  const item = rows[0];
  
  // Обновление связанных данных (опционально)
  if (data.relations) {
    // Логика обновления связанных данных
  }
  
  sendSuccess(res, item);
}

/**
 * Удалить запись
 * @route DELETE /api/<module>/:id
 * @param {string} req.params.id - ID записи
 */
async function remove(req, res) {
  const { id } = req.params;
  await db.query('DELETE FROM <table> WHERE id = $1', [id]);
  sendDeleted(res);
}

/**
 * Массовое обновление
 * @route POST /api/<module>/bulk-update
 * @param {number[]} req.body.ids - Список ID
 * @param {Object} req.body.updates - Данные для обновления
 * @returns {Array} Обновлённые записи
 */
async function bulkUpdate(req, res) {
  const { ids, updates } = req.body;

  if (!Array.isArray(ids) || ids.length === 0) {
    return sendValidationError(res, 'ids required');
  }

  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');

    // Обновление полей
    const setClauses = [];
    const values = [];
    let idx = 1;

    for (const [key, value] of Object.entries(updates)) {
      setClauses.push(`${key} = $${idx}`);
      values.push(value);
      idx++;
    }

    if (setClauses.length > 0) {
      const query = `UPDATE <table> SET ${setClauses.join(', ')} WHERE id = ANY($${idx}::int[]) RETURNING *`;
      values.push(ids);
      await client.query(query, values);
    }

    await client.query('COMMIT');

    const { rows } = await db.query('SELECT * FROM <table> WHERE id = ANY($1::int[])', [ids]);
    sendSuccess(res, rows);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

module.exports = {
  getAll,
  getById,
  create,
  update,
  remove,
  bulkUpdate,
};
```

---

## 📝 Шаблоны файлов (Тип B: Сложный модуль)

### **1. index.js** (аналогично Типу A)

```javascript
/**
 * Главный файл модуля <Module Name>
 * Экспортирует роутер и настройки
 */

const router = require('./routes');
const settings = require('./settings');

module.exports = {
  router,
  settings,
  prefix: '/api/<module_name>',
};
```

---

### **2. settings.js** (аналогично Типу A)

```javascript
/**
 * <Module Name> Module Settings
 */

module.exports = {
  display: {
    itemsPerPage: 30,
    defaultSort: 'date',
    defaultView: 'list',
  },
  features: {
    enableFeature1: true,
    enableFeature2: true,
  },
  currency: {
    default: 'RUB',
    showSymbol: true,
    decimalPlaces: 2,
  },
};
```

---

### **3. routes.js** (главный роутер)

```javascript
/**
 * Главный роутер модуля <Module Name>
 * Объединяет все подмодули
 */

const express = require('express');
const router = express.Router();

// Импортируем подмодули
const invoicesRouter = require('./controllers/invoices');
const paymentsRouter = require('./controllers/payments');
const statementsRouter = require('./controllers/statements');

// Подключаем подмодули
router.use('/invoices', invoicesRouter);
router.use('/payments', paymentsRouter);
router.use('/statements', statementsRouter);

module.exports = router;
```

---

### **4. controllers/<entity>.js** (контроллер для сущности)

```javascript
/**
 * Контроллер сущности <Entity Name>
 * Обработчики HTTP-запросов для <entity>
 */

const { asyncHandler } = require('../../../utils/errorHandler');
const { sendSuccess, sendCreated, sendNotFound, sendDeleted } = require('../../../utils/responseHelpers');
const db = require('../../../db');

/**
 * Получить все <entity>
 * @route GET /api/<module>/<entity>
 */
async function getAll(req, res) {
  const { rows } = await db.query('SELECT * FROM <entity_table> ORDER BY id DESC');
  sendSuccess(res, rows);
}

/**
 * Получить <entity> по ID
 * @route GET /api/<module>/<entity>/:id
 */
async function getById(req, res) {
  const { id } = req.params;
  const { rows } = await db.query('SELECT * FROM <entity_table> WHERE id = $1', [id]);

  if (rows.length === 0) {
    return sendNotFound(res, '<Entity> not found');
  }

  sendSuccess(res, rows[0]);
}

/**
 * Создать <entity>
 * @route POST /api/<module>/<entity>
 */
async function create(req, res) {
  const data = req.body;
  
  const { rows } = await db.query(
    `INSERT INTO <entity_table> (field1, field2) VALUES ($1, $2) RETURNING *`,
    [data.field1, data.field2]
  );

  sendCreated(res, rows[0]);
}

/**
 * Обновить <entity>
 * @route PUT /api/<module>/<entity>/:id
 */
async function update(req, res) {
  const { id } = req.params;
  const data = req.body;
  
  const { rows } = await db.query(
    `UPDATE <entity_table> SET field1 = $1, field2 = $2 WHERE id = $3 RETURNING *`,
    [data.field1, data.field2, id]
  );

  if (rows.length === 0) {
    return sendNotFound(res, '<Entity> not found');
  }

  sendSuccess(res, rows[0]);
}

/**
 * Удалить <entity>
 * @route DELETE /api/<module>/<entity>/:id
 */
async function remove(req, res) {
  const { id } = req.params;
  await db.query(`DELETE FROM <entity_table> WHERE id = $1`, [id]);
  sendDeleted(res);
}

module.exports = {
  getAll,
  getById,
  create,
  update,
  remove,
};
```

---

## 🔧 Подключение модуля в backend/index.js

### **Вариант 1: Ручное подключение**

```javascript
// backend/index.js

// Простой модуль
const tasksModule = require('./modules/tasks');
app.use('/api/tasks', tasksModule.router || tasksModule);

// Сложный модуль
const financeModule = require('./modules/finance');
app.use('/api/finance', financeModule.router || financeModule);
```

---

### **Вариант 2: Автоматическая регистрация (рекомендуется)**

```javascript
// backend/index.js
const { registerModuleRouters } = require('./utils/moduleSettingsLoader');

// После app = express() и middleware
await registerModuleRouters(app);
```

---

## 📋 Чеклист создания нового модуля

### **Для простого CRUD модуля:**

- [ ] Создать директорию `backend/modules/<module>/`
- [ ] Создать `index.js` (скопировать шаблон)
- [ ] Создать `settings.js` (адаптировать настройки)
- [ ] Создать `routes.js` (заменить названия маршрутов)
- [ ] Создать `controllers.js` (адаптировать под таблицу БД)
- [ ] Подключить в `backend/index.js`
- [ ] Протестировать все endpoints
- [ ] Удалить старый файл из `routes/` (если был)

---

### **Для сложного модуля:**

- [ ] Создать директорию `backend/modules/<module>/`
- [ ] Создать `index.js`
- [ ] Создать `settings.js`
- [ ] Создать `routes.js` (главный роутер)
- [ ] Создать директорию `controllers/`
- [ ] Для каждой сущности создать `controllers/<entity>.js`
- [ ] (Опционально) Создать `services/` для бизнес-логики
- [ ] (Опционально) Создать `utils/` для утилит
- [ ] Подключить в `backend/index.js`
- [ ] Протестировать все endpoints
- [ ] Удалить старые файлы из `routes/`

---

## 🎯 Правила хорошего тона

### **Обязательно:**
1. ✅ Использовать `asyncHandler` для всех async функций
2. ✅ Использовать `sendSuccess`, `sendCreated` и т.д. для ответов
3. ✅ Добавлять JSDoc комментарии для всех функций
4. ✅ Использовать параметризованные запросы к БД (защита от SQL-инъекций)
5. ✅ Обрабатывать ошибки через try-catch или asyncHandler

### **Рекомендуется:**
1. ✅ Выносить связанную логику в отдельные функции (`loadRelations`)
2. ✅ Использовать транзакции для массовых операций
3. ✅ Валидировать входные данные перед записью в БД
4. ✅ Логировать важные события через `logger`
5. ✅ Группировать маршруты по сущностям в сложных модулях

### **Запрещено:**
1. ❌ Прямые `res.json()` вместо `sendSuccess()`
2. ❌ Пустые `catch {}` блоки
3. ❌ SQL-инъекции (конкатенация строк в запросах)
4. ❌ Дублирование кода между контроллерами
5. ❌ Файлы >500 строк (разбивать на подмодули)

---

## 📊 Метрики качества модуля

| Метрика | Норма | Критично |
|---------|-------|----------|
| **Размер controllers.js** | ≤300 строк | >500 строк |
| **Размер routes.js** | ≤50 строк | >100 строк |
| **Покрытие JSDoc** | ≥80% | <50% |
| **Количество импортов** | ≤10 | >15 |
| **Сложность модуля** | 1-2 сущности | >5 сущностей |

---

## 🔄 Миграция существующих модулей

### **Порядок миграции:**

1. **Простые модули** (тренировка):
   - `tasks` → `modules/tasks/`
   - `calendar` → `modules/calendar/`
   - `lawyers` → `modules/lawyers/`

2. **Средние модули**:
   - `documents` → `modules/documents/`
   - `mail` → `modules/mail/`
   - `profile` → `modules/profile/`

3. **Сложные модули** (финал):
   - `finance` → `modules/finance/`
   - `legal_cases` → `modules/legal_cases/`

---

## 📚 Примеры

### **Пример 1: Простой модуль Tasks**

См. `backend/modules/tasks/` (после миграции)

### **Пример 2: Сложный модуль Finance**

См. `backend/modules/finance/` (после миграции)

### **Пример 3: Модуль Contractors (уже готов)**

См. `backend/modules/contractors/` — эталон простого модуля

### **Пример 4: Модуль Projects (уже готов)**

См. `backend/modules/projects/` — эталон простого модуля

---

**Готово к использованию!** 🎯
