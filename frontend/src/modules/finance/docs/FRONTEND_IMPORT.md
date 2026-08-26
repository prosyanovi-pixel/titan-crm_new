# Фронтенд импорта банковских выписок TITAN CRM

**Версия**: 2.0  
**Дата**: 25 марта 2026 г.

---

## 📊 Текущая реализация

### ✅ Уже реализовано во фронтенде

1. **Компонент BankStatementsTab** (`components/BankStatementsTab.tsx`)
   - ✅ Отображение списка выписок
   - ✅ Кнопка импорта
   - ✅ Диалог импорта с выбором файла
   - ✅ Автоопределение типа файла (CSV / 1C TXT)
   - ✅ Поддержка кодировки Windows-1251 для 1C файлов
   - ✅ Отображение деталей выписки (суммы, статус, даты)
   - ✅ Сверка выписок (reconcile)
   - ✅ Удаление выписок

2. **Компонент StatementLineRow**
   - ✅ Отображение строк выписки
   - ✅ Привязка к счёту (для приходов)
   - ✅ Привязка категории расходов
   - ✅ Статусы строк (unmatched, auto, manual)

3. **Хук useImportStatement** (`hooks/useFinance.ts`)
   - ✅ Вызов API импорта
   - ✅ Инвалидация кэша после импорта
   - ✅ Toast уведомления о результатах

4. **API financeApi.importStatement** (`api/finance.api.ts`)
   - ✅ Отправка файла на бэкенд
   - ✅ Поддержка полей: content, fileName, importType, account

---

## 🆕 Обновления в связи с улучшениями бэкенда

### Обновлённые типы данных

**Файл**: `types/finance.types.ts`

Добавлены поля в `BankStatement` для поддержки отката:

```typescript
export interface BankStatement {
  // ... существующие поля
  importSessionId?: string;      // ID сессии импорта
  isRolledBack?: boolean;        // Флаг отката
  rolledBackAt?: string;         // Дата отката
  rolledBackBy?: string;         // Кто откатил
  rollbackReason?: string;       // Причина отката
}
```

### Обновлённый хук useImportStatement

**Файл**: `hooks/useFinance.ts`

Теперь обрабатывает новые поля ответа бэкенда:

```typescript
export function useImportStatement() {
  return useMutation({
    mutationFn: (data) => financeApi.importStatement(data),
    onSuccess: (result) => {
      const parts: string[] = [];
      parts.push(`✅ Импортировано ${result.linesCount} строк`);
      
      if (result.contractorsCreated > 0) {
        parts.push(`👥 Создано контрагентов: ${result.contractorsCreated}`);
      }
      if (result.paymentsCreated > 0) {
        parts.push(`💰 Создано платежей: ${result.paymentsCreated}`);
      }
      if (result.duplicatesSkipped > 0) {
        parts.push(`⚠️ Пропущено дубликатов: ${result.duplicatesSkipped}`);
      }
      if (result.contractorsUpdated > 0) {
        parts.push(`🔄 Обновлено контрагентов: ${result.contractorsUpdated}`);
      }
      if (result.newAccountsAdded > 0) {
        parts.push(`🏦 Добавлено счетов: ${result.newAccountsAdded}`);
      }
      if (result.warningsCount > 0) {
        parts.push(`❗ Предупреждений: ${result.warningsCount}`);
      }
      
      toast({ 
        title: result.duplicatesSkipped > 0 || result.warningsCount > 0
          ? 'Импорт завершён с предупреждениями'
          : 'Импорт успешно завершён', 
        description: parts.join('. ') + '.',
      });
    },
  });
}
```

---

## 📋 Что нужно добавить во фронтенд

### 1. Отображение подробного отчёта об импорте

**Где**: `components/BankStatementsTab.tsx` или отдельный компонент `ImportReportDialog`

**Что показывать**:
- Список новых контрагентов
- Список обновлённых контрагентов
- Список добавленных счетов
- Предупреждения (например, найден контрагент с другим ИНН)
- Рекомендации

**Пример**:
```typescript
// После успешного импорта показать диалог с отчётом
{showReport && (
  <ImportReportDialog
    report={importResult.report}
    onClose={() => setShowReport(false)}
  />
)}
```

### 2. Кнопка отката импорта

**Где**: `components/BankStatementsTab.tsx` или в карточке выписки

**Функционал**:
- Кнопка "Откатить импорт" для каждой выписки
- Диалог подтверждения с предупреждением
- Вызов API отката (нужно добавить в finance.api.ts)

**Пример API**:
```typescript
// finance.api.ts
export const financeApi = {
  // ...
  rollbackImport: async (sessionId: string, options?: {
    removeContractors?: boolean;
    reason?: string;
  }) => {
    return api.post(`/finance/import/rollback`, {
      sessionId,
      ...options,
    });
  },
};
```

### 3. Индикация откатенных выписок

**Где**: `components/BankStatementsTab.tsx`, компонент `StatementRow`

**Что показывать**:
- Бейдж "Откатено" для выписок с `isRolledBack = true`
- Дата и причина отката
- Запрет действий с откатенными выписками

### 4. Страница истории импортов

**Где**: Новый компонент `ImportHistory.tsx` или вкладка в BankStatementsTab

**Что показывать**:
- Список всех сессий импорта
- Статус (in_progress, completed, rolled_back, failed)
- Детали каждого импорта
- Кнопка отката для завершённых импортов

---

## 🔧 Технические детали

### Кодировка файлов

Фронтенд уже правильно обрабатывает кодировку:

```typescript
const decodeFile = (file: File, type: 'csv' | '1c_txt') => {
  const reader = new FileReader();
  reader.onload = ev => {
    const buffer = ev.target?.result as ArrayBuffer;
    const encoding = type === '1c_txt' ? 'windows-1251' : 'utf-8';
    const decoder = new TextDecoder(encoding);
    setFileContent(decoder.decode(buffer));
  };
  reader.readAsArrayBuffer(file);
};
```

### Автоопределение типа файла

```typescript
const lowerName = file.name.toLowerCase();
const detectedType: 'csv' | '1c_txt' =
  lowerName.endsWith('.txt') || lowerName.includes('1c') ? '1c_txt' : 'csv';
```

---

## 📝 План доработки фронтенда

### Приоритет 1 (критично)

1. ✅ **Обновить типы** — выполнено
2. ✅ **Обновить хук useImportStatement** — выполнено
3. ⏳ **Добавить API для отката** — `finance.api.ts`
4. ⏳ **Кнопка отката в BankStatementsTab**

### Приоритет 2 (важно)

5. ⏳ **Отображение подробного отчёта** — диалог после импорта
6. ⏳ **Индикация откатенных выписок** — бейдж в StatementRow
7. ⏳ **Обработка предупреждений** — показывать список проблем

### Приоритет 3 (желательно)

8. ⏳ **Страница истории импортов**
9. ⏳ **Массовый откат нескольких выписок**
10. ⏳ **Экспорт отчёта в PDF/Excel**

---

## 🎯 Примеры использования

### Импорт выписки

```typescript
// В компоненте BankStatementsTab
const importFn = useImportStatement();

const handleImport = async (file: File) => {
  const content = await readFileAsText(file, 'windows-1251');
  await importFn.mutateAsync({
    content,
    fileName: file.name,
    importType: '1c_txt',
    account: extractAccountFromFileName(file.name),
  });
};
```

### Откат импорта (будущая реализация)

```typescript
// В компоненте StatementRow
const rollbackFn = useRollbackImport();

const handleRollback = async () => {
  if (!confirm('Откатить импорт?')) return;
  await rollbackFn.mutateAsync({
    sessionId: stmt.importSessionId,
    reason: 'Пользователь отменил',
  });
};
```

---

## 📞 Интеграция с бэкендом

### API эндпоинты

| Метод | Endpoint | Описание |
|-------|----------|----------|
| POST | `/api/finance/statements/import` | Импорт выписки |
| POST | `/api/finance/import/rollback` | Откат импорта (нужно добавить) |
| GET | `/api/finance/import/sessions` | История сессий (нужно добавить) |

### Формат ответа импорта

```typescript
interface ImportResult {
  statementId: string;
  linesCount: number;
  totalCredit: number;
  totalDebit: number;
  contractorsCreated: number;
  contractorsUpdated: number;
  newAccountsAdded: number;
  paymentsCreated: number;
  duplicatesSkipped: number;
  warningsCount: number;
  report?: {
    newContractors: Array<{ id: string; name: string }>;
    updatedContractors: Array<{ id: string; name: string; changes: string[] }>;
    newAccounts: Array<{ contractorId: string; accountInfo: string }>;
    warnings: Array<{ message: string }>;
    suggestions: string[];
  };
}
```

---

**Версия документа**: 1.0  
**Дата обновления**: 25 марта 2026 г.  
**TITAN CRM Finance Module**
