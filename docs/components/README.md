# Компоненты фронтенда TITAN CRM

## Обзор
Эта документация описывает архитектуру и компоненты фронтенд части системы TITAN CRM (React 18 + TypeScript + Tailwind CSS + Shadcn/Radix UI).

## Структура компонентов

### `frontend/src/components/`
- `ui/` - Базовые UI-компоненты (Shadcn): `button`, `input`, `dialog`, `table`, `data-table`, `form`, `card`, `select`, `sheet`, `tabs`, `toast` и др., а также составные: `FileUploader`, `MoneyInput`, `StatusBadge`, `PriorityBadge`, `StatsCard`, `confirm-dialog`, `empty-state`, `date-picker` и др.
- `layout/` - Макеты приложения: `AppLayout`, `AppHeader`, `AppSidebar`, `AuthorizedLayout`, `CommandPalette`, `NotificationDropdown`, `GlobalProgress`
- `permissions/` - Компоненты проверки прав (`<Can>` / `<Cannot>`)
- `settings/` - Компоненты настроек
- `shared/` - Общие компоненты
- `ai/` - AI-компоненты
- `AppInitializer.tsx`, `ErrorBoundary.tsx` - Инициализация приложения и обработка ошибок

### `frontend/src/shared/`
- Общие категории (`categories/`), API-хелперы (`api/`), публичный экспорт через `index.ts`

### Модульные компоненты
Компоненты модулей живут внутри своих модулей: `frontend/src/modules/<module>/components/`, `pages/`, `hooks/` и т.д. Кросс-модульная оркестрация — в `src/routes.tsx`. Границы модулей описаны в `frontend/src/modules/STANDARD.md`.

## Паттерны использования

### Компоненты с состоянием
- Управление серверным состоянием через TanStack Query
- Глобальные данные — через React-контексты (`src/context/`, например `LayoutContext` с хуком `usePageSettings`)
- Обработка форм с помощью React Hook Form + Zod

### Доступность
- Поддержка клавиатурной навигации
- ARIA метаданные
- Семантическая разметка HTML

## Технические спецификации

### Структура компонентов
Каждый компонент должен содержать:
- Основной файл компонента (.tsx)
- Стили через Tailwind CSS (отдельные .css файлы — по необходимости)
- Тесты (если применимо)
- JSDoc-документацию для экспортируемых компонентов (на русском языке)

### Пропсы и интерфейсы
```typescript
interface UserCardProps {
  user: User;
  onEdit?: () => void;
  onDelete?: () => void;
}
```

## Лучшие практики
- Использовать существующие компоненты Shadcn вместо создания новых
- Использовать Tailwind CSS для стилей
- Реализация компонентов с высокой переиспользуемостью
- Обеспечение адаптивности
- Весь пользовательский текст — только через i18n (`useTranslation`, локали в `src/lib/i18n/locales/ru/`), без захардкоженного русского текста
- При создании страницы модуля использовать хук `usePageSettings` из `@/context/LayoutContext` (не рендерить заголовок/экшены инлайн)
