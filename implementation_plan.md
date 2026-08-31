# Рефакторинг действий (Row Actions) и массовых действий (Bulk Actions) по образцу модуля Contractors

## Описание проблемы

Модуль `contractors` является **эталонным** примером реализации действий через `ActionRegistry` + `useModuleActions` + `useBulkActions`. Все остальные модули **не следуют** этому паттерну и хардкодят действия строк (`view`, `edit`, `delete`) непосредственно в компонентах таблиц.

### Текущее состояние

| Модуль | Компонент(-ы) | Использует `useModuleActions` | Использует `useBulkActions` | Использует `getQuickActionsByModule` | Хардкодит действия |
|--------|---------------|-------------------------------|------------------------------|--------------------------------------|-------------------|
| **contractors** | `ContractorTableRow.tsx` | ✅ | ❌ | ✅ | ❌ |
| **projects** | `ProjectTableRow.tsx` | ❌ | ❌ | ❌ (через props) | ✅ edit, delete |
| **tasks** | `TaskTableRow.tsx` | ❌ | ❌ | ❌ (через props) | ✅ edit, delete |
| **services** | `ServiceTableRow.tsx`, `ServicesTable.tsx` | ❌ | ❌ | ✅ (ServicesTable) | ✅ edit, delete |
| **warehouse** | `WarehouseTableRow.tsx` | ❌ | ❌ | ✅ | ✅ edit, delete |
| **finance** | `InvoiceTableRow.tsx`, `PaymentTableRow.tsx`, `InvoicesTable.tsx`, `PaymentsTable.tsx` | ❌ | ❌ | ✅ (Tables) | ✅ view, edit, delete + **захардкоженный русский текст** |
| **lawyers** | `LawyerTableRow.tsx`, `CaseTableRow.tsx` | ❌ | ❌ | ❌ (через props) | ✅ edit, delete |
| **products** | `ProductTableRow.tsx`, `ProductsTable.tsx` | ❌ | ❌ | ✅ (ProductsTable) | ✅ edit, delete |
| **price_lists** | `PriceListTableRow.tsx` | ❌ | ❌ | ✅ | ✅ view, edit, download, activate, make_default, delete |
| **quotes** | `QuoteTableRow.tsx` | ❌ | ❌ | ❌ | ✅ view, edit, delete |
| **marketing** | `MarketingPage.tsx` (inline) | ❌ | ❌ | ❌ | ✅ edit, delete |
| **contracts** | `ContractList.tsx` (inline) | ❌ | ❌ | ❌ | ✅ view, edit, delete |
| **templates** | `TemplatesPage.tsx` (inline) | ❌ | ❌ | ❌ | ✅ edit, copy, delete |
| **reports** | `ReportsPage.tsx` (inline) | ❌ | ❌ | ❌ | ✅ view, duplicate, share, delete |

> [!IMPORTANT]
> В `InvoicesTable.tsx` и `PaymentsTable.tsx` присутствует **захардкоженный русский текст** ('Просмотреть', 'Редактировать', 'Удалить'), что нарушает правило i18n.

### Также примечательно
- `ContractorTable.tsx` (старый компонент) тоже хардкодит действия — но он используется не в основном реестре, а как fallback. Его тоже надо привести в порядок.
- Модули `contracts`, `quotes`, `templates`, `reports` **не зарегистрированы** в [`registerDefaultActions.ts`](file:///Users/titan/Documents/titan-crm/frontend/src/modules/registry/registerDefaultActions.ts), что означает что `useModuleActions` не вернёт для них никаких действий.

---

## Предлагаемые изменения

### Компонент 1: Расширение реестра действий

#### [MODIFY] [registerDefaultActions.ts](file:///Users/titan/Documents/titan-crm/frontend/src/modules/registry/registerDefaultActions.ts)

Добавить недостающие модули в `commonModules`:
- `contracts`, `quotes`, `templates`, `reports`

Добавить `view` как стандартное row-действие для всех модулей (сейчас зарегистрированы только `view`, `edit`, `delete` — но `view` не у всех).

Для модулей со специфическими действиями (price_lists, templates, reports) добавить дополнительные регистрации:
- `price_lists`: `download_pdf`, `activate`, `deactivate`, `make_default`
- `templates`: `copy`
- `reports`: `duplicate`, `share`

---

### Компонент 2: Рефакторинг TableRow компонентов

Для каждого модуля нужно:
1. Добавить `import { useModuleActions } from "@/modules/registry/hooks/useModuleActions"`
2. Вызвать `const systemActions = useModuleActions("имя_модуля")`
3. Получить кастомные быстрые действия: `const customQuickActions = getQuickActionsByModule("имя_модуля")`
4. Сформировать `allActions` по образцу ContractorTableRow: мерж `customQuickActions` + `systemActions` с маппингом через `t()` для labelKey

> [!WARNING]
> Для модулей, где используются два компонента таблицы (ServiceTableRow + ServicesTable, ProductTableRow + ProductsTable, InvoiceTableRow + InvoicesTable, PaymentTableRow + PaymentsTable), рефакторинг нужно делать в обоих компонентах, чтобы не было рассинхронизации.

#### Файлы для рефакторинга:

**Приоритет 1** — Основные `*TableRow.tsx` компоненты:
- [ProjectTableRow.tsx](file:///Users/titan/Documents/titan-crm/frontend/src/modules/projects/components/ProjectTableRow.tsx)
- [TaskTableRow.tsx](file:///Users/titan/Documents/titan-crm/frontend/src/modules/tasks/components/TaskTableRow.tsx)
- [ServiceTableRow.tsx](file:///Users/titan/Documents/titan-crm/frontend/src/modules/services/components/ServiceTableRow.tsx)
- [WarehouseTableRow.tsx](file:///Users/titan/Documents/titan-crm/frontend/src/modules/warehouse/components/rows/WarehouseTableRow.tsx)
- [InvoiceTableRow.tsx](file:///Users/titan/Documents/titan-crm/frontend/src/modules/finance/components/InvoiceTableRow.tsx)
- [PaymentTableRow.tsx](file:///Users/titan/Documents/titan-crm/frontend/src/modules/finance/components/PaymentTableRow.tsx)
- [LawyerTableRow.tsx](file:///Users/titan/Documents/titan-crm/frontend/src/modules/lawyers/components/LawyerTableRow.tsx)
- [CaseTableRow.tsx](file:///Users/titan/Documents/titan-crm/frontend/src/modules/lawyers/components/CaseTableRow.tsx)
- [ProductTableRow.tsx](file:///Users/titan/Documents/titan-crm/frontend/src/modules/products/components/ProductTableRow.tsx)
- [PriceListTableRow.tsx](file:///Users/titan/Documents/titan-crm/frontend/src/modules/price_lists/components/PriceListTableRow.tsx)
- [QuoteTableRow.tsx](file:///Users/titan/Documents/titan-crm/frontend/src/modules/quotes/components/QuoteTableRow.tsx)

**Приоритет 2** — `*Table.tsx` компоненты (дублируют действия):
- [ContractorTable.tsx](file:///Users/titan/Documents/titan-crm/frontend/src/modules/contractors/components/ContractorTable.tsx)
- [ServicesTable.tsx](file:///Users/titan/Documents/titan-crm/frontend/src/modules/services/components/ServicesTable.tsx)
- [ProductsTable.tsx](file:///Users/titan/Documents/titan-crm/frontend/src/modules/products/components/ProductsTable.tsx)
- [InvoicesTable.tsx](file:///Users/titan/Documents/titan-crm/frontend/src/modules/finance/components/InvoicesTable.tsx)
- [PaymentsTable.tsx](file:///Users/titan/Documents/titan-crm/frontend/src/modules/finance/components/PaymentsTable.tsx)

**Приоритет 3** — Inline компоненты (действия внутри страниц):
- [MarketingPage.tsx](file:///Users/titan/Documents/titan-crm/frontend/src/modules/marketing/pages/MarketingPage.tsx)
- [TemplatesPage.tsx](file:///Users/titan/Documents/titan-crm/frontend/src/modules/templates/pages/TemplatesPage.tsx)
- [ContractList.tsx](file:///Users/titan/Documents/titan-crm/frontend/src/modules/contracts/components/ContractList.tsx)
- [ReportsPage.tsx](file:///Users/titan/Documents/titan-crm/frontend/src/modules/reports/pages/ReportsPage.tsx)

---

### Компонент 3: Исправление захардкоженного русского текста (i18n)

#### [MODIFY] [InvoicesTable.tsx](file:///Users/titan/Documents/titan-crm/frontend/src/modules/finance/components/InvoicesTable.tsx)
- Заменить `'Просмотреть'` → `t('common.view')`
- Заменить `'Редактировать'` → `t('common.edit')`
- Заменить `'Удалить'` → `t('common.delete')`

#### [MODIFY] [PaymentsTable.tsx](file:///Users/titan/Documents/titan-crm/frontend/src/modules/finance/components/PaymentsTable.tsx)
- Аналогичная замена трёх строк

---

## Open Questions

> [!IMPORTANT]
> **Вопрос 1:** Модули `CaseTableRow` и `LawyerTableRow` в модуле `lawyers` — для них в реестре регистрируются действия под `moduleId = "lawyers"`. Но дела (cases) — это отдельная сущность. Нужно ли регистрировать `cases` как отдельный модуль в `registerDefaultActions.ts`? (Я предлагаю: да, добавить `"cases"` в `commonModules`.)

> [!IMPORTANT]
> **Вопрос 2:** У `price_lists` есть модуль-специфичные действия (download_pdf, activate/deactivate, make_default). Нужно ли их регистрировать в `registerDefaultActions.ts` как отдельные системные действия, или оставить их хардкоженными в компоненте (они не настраиваются в UI)?

> [!IMPORTANT]
> **Вопрос 3:** Модуль `reports` имеет уникальное действие `share` (поделиться/закрыть доступ). Аналогично — регистрировать в реестре или оставить локально?

---
rtifact Comments
Approved
Implementation Plan
IMPORTANT
да. нужно

Вопрос 2: У price_lists есть модуль-специфичные действия (download_pdf, activate/deactivate, make_de...
нужно и посмотреть чтобы в других модулях можно было использовать аналогичные

Вопрос 3: Модуль reports имеет уникальное действие share (поделиться/закрыть доступ). Аналогично — р...
да. аналогичные действия могут понадобиться в других модулях. продкмать как можно реализовать 

## Verification Plan

### Automated Tests
```bash
cd /Users/titan/Documents/titan-crm/frontend && npm run build
cd /Users/titan/Documents/titan-crm/frontend && npm run lint
```

### Manual Verification
- Проверить, что после сборки нет TS-ошибок
- Проверить, что для каждого модуля `QuickActionsMenu` отображает действия корректно (через запуск dev-сервера)
- Проверить, что в настройках модулей тумблеры действий работают корректно (включение/отключение)
