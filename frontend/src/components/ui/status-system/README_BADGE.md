# Универсальная система бейджей (Status System)

Новая система компонентов `Badge` заменяет дублирующиеся компоненты `StatusBadge`, `PriorityBadge`, `Tag`, `OutcomeBadge` и предоставляет единый гибкий интерфейс.

## Импорт

```tsx
// Базовый компонент с выбором типа
import { Badge } from '@/components/ui/status-system';

// Готовые обёртки для конкретных типов
import { StatusBadge, PriorityBadge, TagBadge, OutcomeBadge } from '@/components/ui/status-system';

// Список тегов
import { TagList } from '@/components/ui/status-system';

// Типы
import type { BadgeVariant, BadgeSize, BadgeShape } from '@/components/ui/status-system';
```

## Примеры использования

### 1. Статус из базы данных
```tsx
<StatusBadge id="active" />
```
Или через базовый Badge:
```tsx
<Badge id="active" type="status" />
```

### 2. Приоритет с кастомным цветом
```tsx
<PriorityBadge id="high" color="#ef4444" variant="solid" />
```

### 3. Тег с переопределением названия
```tsx
<TagBadge id="vip" name="VIP Клиент" shape="pill" />
```

### 4. Исход (outcome)
```tsx
<OutcomeBadge id="won" />
```

### 5. Произвольный бейдж без привязки к БД
```tsx
<Badge id="custom" name="Новый" color="#8b5cf6" variant="outline" size="lg" />
```

## Параметры

### Основные пропсы (для Badge)

| Параметр | Тип | По умолчанию | Описание |
|----------|-----|--------------|----------|
| `id` | `string` | **обязательно** | Идентификатор в БД (например, `"active"`, `"high"`, `"vip"`) |
| `type` | `'status' \| 'priority' \| 'tag' \| 'outcome'` | `'status'` | Тип сущности для загрузки цвета и названия из БД |
| `name` | `string` | — | Переопределение названия (если не указано, берётся из БД) |
| `color` | `string` | — | Переопределение цвета (если не указано, берётся из БД) |
| `variant` | `'solid' \| 'soft' \| 'outline' \| 'ghost'` | `'soft'` | Визуальный вариант |
| `size` | `'xs' \| 'sm' \| 'md' \| 'lg'` | `'md'` | Размер |
| `shape` | `'square' \| 'rounded' \| 'pill' \| 'left-pill' \| 'right-pill' \| 'top-pill' \| 'bottom-pill' \| 'bubble' \| 'stadium'` | `'pill'` | Форма скругления |
| `showDot` | `boolean` | `false` | Показывать точку слева цвета бейджа |
| `uppercase` | `boolean` | `false` | Текст заглавными буквами |
| `noWrap` | `boolean` | `true` | Запрет переноса текста |
| `onClick` | `() => void` | — | Обработчик клика (делает бейдж кликабельным) |
| `disabled` | `boolean` | `false` | Отключить бейдж |
| `className` | `string` | — | Дополнительные CSS-классы |
| `title` | `string` | — | Текст всплывающей подсказки |

### Готовые обёртки

`StatusBadge`, `PriorityBadge`, `TagBadge`, `OutcomeBadge` принимают те же пропсы, что и `Badge`, но без параметра `type` (он уже задан).

### TagList

Компонент для отображения списка тегов с ограничением количества.

```tsx
<TagList
  tags={[
    { id: 'vip', name: 'VIP', color: '#a855f7' },
    { id: 'new', name: 'Новый', color: '#ec4899' },
    // ...
  ]}
  onRemove={(id) => console.log('Удалить', id)}
  maxVisible={5}
  size="sm"
  variant="soft"
  shape="pill"
/>
```

## Интеграция с БД

Компоненты автоматически загружают цвета и названия через хуки `useStatuses`, `usePriorities`, `useTags`, `useOutcomes`. Данные кэшируются с помощью TanStack Query.

Если запись с указанным `id` не найдена в БД, будет использовано переданное `name` (или сам `id` как fallback) и цвет по умолчанию (`#6b7280`).

## Настройка стилей через Settings

В будущем можно добавить в настройки модуля выбор предпочтительных `variant`, `size`, `shape` для каждого типа бейджа. Пока что стили задаются непосредственно в компонентах.

## Миграция со старых компонентов

1. Замените импорты:
   - `import { StatusBadge } from '@/components/ui/status-system'` → остаётся тем же (но теперь это новая обёртка).
   - `import { Tag } from '@/components/ui/status-system/Tag'` → лучше использовать `import { TagBadge } from '@/components/ui/status-system'`.

2. Адаптируйте пропсы:
   - Старый `StatusBadge` принимал `statusId`, новый `StatusBadge` принимает `id`.
   - Старый `Tag` принимал `tagId`, новый `TagBadge` принимает `id`.
   - Цвета и названия теперь подгружаются из БД автоматически.

3. После полного перехода можно удалить старые файлы:
   - `ui/PriorityBadge.tsx`
   - `ui/StatusBadge.tsx`
   - `ui/Tag.tsx`
   - (опционально) старые компоненты внутри `ui/status-system/`, если они больше не используются.

## Примеры в коде

Смотрите также JSDoc в `Badge.tsx` и демонстрацию в модулях contractors и settings.