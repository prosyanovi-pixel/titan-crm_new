# Модуль Projects (Проекты)

**Статус:** ✅ Рефакторинг завершён на 64%  
**Последнее обновление:** 2026-03-07

---

## 📋 Описание

Модуль управления проектами в TITAN CRM. Предоставляет полный цикл управления проектами:

- ✅ Создание и редактирование проектов
- ✅ Управление этапами проекта
- ✅ Управление доходами и расходами
- ✅ График платежей
- ✅ Задачи проекта
- ✅ Канбан-доска, диаграмма Ганта
- ✅ Ресурсы проекта

---

## 🏗️ Архитектура

```
projects/
├── api/                      # API слой
│   ├── endpoints.ts          # Эндпоинты API
│   ├── index.ts              # Экспорты
│   └── projects.api.ts       # API сервис для проектов
│
├── components/               # React компоненты
│   ├── ProjectSheet.tsx      # Панель проекта
│   ├── ProjectList.tsx       # Список проектов
│   ├── ProjectBoard.tsx      # Канбан-доска
│   ├── ProjectGantt.tsx      # Диаграмма Ганта
│   ├── ProjectResources.tsx  # Ресурсы
│   ├── tabs/                 # Вкладки проекта
│   │   ├── ProjectGeneralTab.tsx
│   │   ├── ProjectStagesTab.tsx
│   │   ├── ProjectRevenuesTab.tsx
│   │   ├── ProjectExpensesTab.tsx
│   │   └── ProjectTasksTab.tsx
│   └── index.ts
│
├── hooks/                    # Custom React hooks
│   ├── useProjects.ts        # Загрузка списка проектов (TanStack Query)
│   ├── useProjectsPage.ts    # Логика страницы проектов
│   ├── useProjectCRUD.ts     # CRUD операции
│   ├── useProjectSheet.ts    # Логика панели проекта
│   ├── useProjectQueries.ts  # TanStack Query хуки (queries + mutations)
│   ├── useProjectStages.ts   # Управление этапами
│   ├── useProjectRevenues.ts # Управление доходами
│   ├── useProjectExpenses.ts # Управление расходами
│   └── index.ts
│
├── types/                    # TypeScript типы
│   ├── project.types.ts      # Основные типы проектов
│   ├── project-task.types.ts # Типы задач проекта
│   ├── api.types.ts          # Типы API ответов
│   └── index.ts
│
├── i18n/ru/                  # Переводы (русский)
│   ├── projects.ts           # Ключи переводов
│   └── index.ts
│
├── pages/
│   └── ProjectsPage.tsx      # Главная страница модуля
│
└── index.ts                  # Публичный API модуля
```

---

## 🚀 Использование

### Базовый хук

```typescript
import { useProjects } from '@/modules/projects';

function MyComponent() {
  const { projects, loading, error, refetch } = useProjects();
  
  if (loading) return <SkeletonLoader />;
  if (error) return <ErrorMessage error={error} />;
  
  return (
    <ProjectList projects={projects} />
  );
}
```

### CRUD операции

```typescript
import { useProjectCRUD, useProjectMutations } from '@/modules/projects';

function ProjectActions() {
  const { createProject, updateProject, deleteProject } = useProjectMutations();
  
  const handleCreate = async () => {
    const newProject = await createProject({
      name: 'Новый проект',
      client: 'Клиент',
      manager: 'Менеджер',
      status: 'pending',
      priority: 'High',
      budget: 100000,
      deadline: '31.12.2024'
    });
  };
  
  const handleUpdate = async (id: number) => {
    await updateProject({
      id,
      data: { status: 'active' }
    });
  };
  
  const handleDelete = async (id: number) => {
    await deleteProject(id);
  };
}
```

### Управление этапами

```typescript
import { useProjectStages } from '@/modules/projects';

function StagesManager({ projectId }: { projectId: number }) {
  const { stages, createStage, updateStage, deleteStage } = useProjectStages({
    projectId,
    enabled: true
  });
  
  return (
    <div>
      {stages.map(stage => (
        <StageCard key={stage.id} stage={stage} />
      ))}
    </div>
  );
}
```

---

## 📦 Типы данных

### Project

```typescript
interface Project {
  id: number;
  parentId?: number | null;
  name: string;
  client: string;
  manager: string;
  status: ProjectStatus; // "active" | "pending" | "paused" | "finished"
  stage: ProjectCompletionStage; // "todo" | "in_progress" | "review" | "done"
  priority: ProjectPriority; // "High" | "Medium" | "Low"
  budget: number;
  budgetUsed: number;
  deadline: string;
  tasksCount: number;
  completedTasks: number;
  subProjects?: Project[];
}
```

### ProjectStage

```typescript
interface ProjectStage {
  id: number;
  projectId: number;
  name: string;
  description?: string;
  startDate: string;
  endDate: string;
  progress: number; // 0-100
  isCompleted: boolean;
  orderIndex: number;
  budget?: number;
  budgetUsed?: number;
}
```

---

## 🔌 API Endpoints

| Метод | Эндпоинт | Описание |
|-------|----------|----------|
| GET | `/projects` | Получить все проекты |
| GET | `/projects/:id` | Получить проект по ID |
| POST | `/projects` | Создать проект |
| PUT | `/projects/:id` | Обновить проект |
| DELETE | `/projects/:id` | Удалить проект |
| GET | `/projects/:id/stages` | Получить этапы проекта |
| POST | `/projects/:id/stages` | Создать этап |
| PUT | `/projects/:id/stages/:stageId` | Обновить этап |
| DELETE | `/projects/:id/stages/:stageId` | Удалить этап |
| GET | `/projects/:id/revenues` | Получить доходы |
| GET | `/projects/:id/expenses` | Получить расходы |
| GET | `/projects/:id/payments` | Получить график платежей |

---

## 🎨 Компоненты

### ProjectSheet

Панель для создания/редактирования проекта с вкладками:
- **Обзор** — основная информация
- **Этапы** — управление этапами
- **Задачи** — список задач
- **Доходы** — финансы (доходы)
- **Расходы** — финансы (расходы)

```tsx
<ProjectSheet
  project={selectedProject}
  open={sheetOpen}
  onOpenChange={setSheetOpen}
  onSave={handleSave}
  contractors={contractors}
  references={references}
/>
```

### ProjectList

Таблица проектов с:
- Сортировкой по колонкам
- Фильтрацией (статус, приоритет, менеджер)
- Массовыми операциями
- Настраиваемыми колонками

### ProjectBoard

Канбан-доска с drag-and-drop для изменения статуса проектов.

### ProjectGantt

Диаграмма Ганта для визуализации временной шкалы проектов.

---

## 🔄 Состояние (State Management)

Модуль использует **TanStack Query (React Query v5)** для управления серверным состоянием:

- ✅ Автоматическое кэширование
- ✅ Инвалидация при мутациях
- ✅ Оптимистичные обновления
- ✅ Retry логика
- ✅ Stale time (5 минут по умолчанию)

### Query Keys

```typescript
// Список проектов
['projects', 'list']

// Проект по ID
['projects', 'byId', projectId]

// Этапы проекта
['projects', projectId, 'stages']

// Доходы проекта
['projects', projectId, 'revenues']

// Расходы проекта
['projects', projectId, 'expenses']

// График платежей
['projects', projectId, 'payments']
```

---

## 🌐 Интернационализация (i18n)

Все тексты используют ключи переводов:

```typescript
import { useTranslation } from '@/lib/i18n';

function MyComponent() {
  const { t } = useTranslation();
  
  return <h1>{t('projects.title')}</h1>;
}
```

Файл переводов: [`i18n/ru/projects.ts`](./i18n/ru/projects.ts)

---

## 🧪 Тестирование

```bash
# Запустить тесты модуля
npm run test -- projects

# Запустить конкретный тест
npm run test -- -t "useProjectCRUD"
```

Тесты находятся в [`hooks/__tests__/`](./hooks/__tests__/).

---

## 📝 Changelog

### 2026-03-07 — Рефакторинг на TanStack Query

**Изменения:**
- ✅ Все хуки переведены на TanStack Query
- ✅ Создан `useProjectQueries.ts` с полным набором query/mutation
- ✅ Обновлены: `useProjects`, `useProjectCRUD`, `useProjectStages`, `useProjectRevenues`, `useProjectExpenses`
- ✅ Исправлен хардкод русского текста
- ✅ Добавлены JSDoc комментарии
- ✅ Исправлены TypeScript ошибки

**Breaking Changes:**
- Хуки теперь возвращают данные напрямую, а не через `response.data`
- Удалены методы `loadStages()`, `loadRevenues()`, `loadExpenses()` — данные загружаются автоматически
- Мутации используют стандартный интерфейс TanStack Query

---

## 🔗 Связанные модули

- **Tasks** — задачи проекта
- **Finance** — финансы (категории расходов, налоги)
- **Contractors** — клиенты/контрагенты
- **Settings** — справочники (статусы, приоритеты)

---

## 📚 Документация

- [DEVELOPMENT_RULES.md](../../../../DEVELOPMENT_RULES.md) — правила разработки
- [KODA_RULES.md](../../../../KODA_RULES.md) — правила для AI-ассистента
- [ARCHITECTURE_PLAN.md](../../../ARCHITECTURE_PLAN.md) — архитектура frontend

---

**Поддерживается:** prosyanovi-pixel  
**Лицензия:** MIT
