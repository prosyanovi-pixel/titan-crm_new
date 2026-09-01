# Модуль Контрагенты (contractors)

## Назначение
Ядро системы: ведение базы контрагентов (компаний и контактов), их классификация, налоговая история, банковские счета, теги, а также обогащение данных (enrichment).

## Основные функции
- Реестр контрагентов с типами и статусами
- Контакты контрагентов (телефоны, e-mail, адреса)
- Банковские счета контрагентов
- Классификация организационно-правовых форм (ОПФ) и групп
- Налоговая история (изменения налоговых статусов)
- Теги и произвольные метки
- Обогащение данных из внешних источников (enrichment, AI-подсказки)
- Мягкое удаление и корзина

## Технические спецификации

### Ключевые файлы
- Frontend: `frontend/src/modules/contractors/` — ContractorsPage, `api/contractorService.ts`, `api/contractors.api.ts`, `api/endpoints.ts`
- Backend: `backend/modules/contractors/routes.js`, `backend/modules/contractors/taxRoutes.js`

### API конечные точки
- `GET/POST /api/contractors` — список/создание контрагентов
- `GET/PUT/DELETE /api/contractors/:id` — карточка контрагента
- `POST /api/contractors/bulk-update`, `POST /api/contractors/bulk-delete` — массовые операции
- `GET /api/contractors/:id/activity` (+ `/chart`) — активность контрагента
- `POST /api/contractors/:id/convert` — конвертация (лид ↔ контрагент)
- Налоги: `GET /api/contractors/:id/taxes`, `PATCH /:id/tax-system`, `GET /:id/taxes/history`, `GET /:id/taxes/calculate`, `GET /:id/taxes/limits-check`, `GET /:id/taxes/optimization-suggestions`
- ОПФ: `GET /api/contractors/legal-forms`, `GET /api/contractors/legal-forms/:code/tax-regimes`
- Enrichment-эндпоинты (обогащение данных) — в `backend/modules/enrichment/` (`/api/enrichment`)

### Схема базы данных
- `contractors`, `contractor_contacts`, `contractor_bank_accounts`
- `contractor_status`, `contractor_type`, `contractor_tags`, `contractor_tax_history`
- `defined_tags`
- `legal_form`, `legal_form_groups` — классификация ОПФ
- `enrichment_jobs`, `enrichment_stats`, `ai_insights` — обогащение

## Структура компонентов
- ContractorsPage.tsx (реестр + карточка контрагента)

## Лучшие практики
- Модуль `contractors` — core domain: единственный фичер-модуль, разрешённый к импорту из других модулей
- Уникальность контрагентов контролировать по ИНН/наименованию (см. импорт и валидацию)
- Новые права доступа синхронизировать в `permissions.ts`, i18n и сидах БД

## Интеграция с настройками действий (ActionRegistry и Быстрые действия)
Модуль `contractors` является эталонным примером того, как должны быть реализованы настраиваемые системные действия строк (Row Actions) и кастомные "Быстрые действия" (Quick Actions) для таблиц.
При реализации аналогичного функционала в других модулях необходимо следовать этому паттерну:

1. **Регистрация системных действий:**
   - Системные действия (просмотр, редактирование, удаление и т.д.) регистрируются через `ActionRegistry` (файл `frontend/src/modules/registry/registerDefaultActions.ts`).
   - Они не хардкодятся в компонентах, а извлекаются через хук `useModuleActions('имя_модуля')`.
   - В БД настройки видимости системных действий сохраняются в таблице `module_settings` в секции `rowActions` (сохраняя состояние включен/выключен — `isActive: boolean`).

2. **Кастомные быстрые действия (Quick Actions):**
   - Получаются через глобальный контекст настроек: `const { getQuickActionsByModule } = useSettings();`.
   - Используйте фильтрацию: `getQuickActionsByModule('имя_модуля').filter(action => action.isActive !== false)`.

3. **Слияние действий в UI:**
   - Компонент таблицы (например, `ContractorTableRow.tsx`) должен объединять оба типа действий и передавать их в универсальный `QuickActionsMenu`:
   ```tsx
   const { actions: systemActions } = useModuleActions('contractors');
   const { getQuickActionsByModule } = useSettings();
   
   const customQuickActions = getQuickActionsByModule('contractors')
     .filter(action => action.isActive !== false)
     .map(action => ({
       label: action.name,
       action: action.action,
       icon: action.icon,
       isQuickAction: true
     }));

   // Слияние системных действий (у которых isActive не false) и кастомных
   const allActions = [
     ...customQuickActions,
     ...systemActions
       .filter(a => a.isActive !== false)
       .map(a => ({
         label: t(`settings.action_types.${a.id}`, { defaultValue: a.label }),
         action: a.id,
         icon: a.icon || 'MoreVertical',
         isQuickAction: false
       }))
   ];
   ```

4. **Иконки действий:**
   - `QuickActionsMenu` поддерживает динамический импорт любых иконок из библиотеки `lucide-react`. Если пользователь выбирает нестандартную иконку в настройках модуля, она автоматически подгружается и рендерится в меню строк. Убедитесь, что вы не используете захардкоженные словари иконок (как было с `ICON_MAP`).

5. **Локализация (i18n):**
   - Названия системных действий (Row Actions) в UI должны переводиться через неймспейс `settings.action_types.[action_id]`.
   - В случае отсутствия перевода можно передавать резервное значение (fallback): `defaultValue: a.label`.
   - Названия кастомных быстрых действий (Quick Actions) берутся напрямую из БД (`action.name`), так как их создает пользователь.

6. **Массовые действия (Bulk Actions):**
   - Механика полностью аналогична `rowActions`.
   - Для массовых действий используйте хук `const { actions: bulkActions } = useBulkActions('имя_модуля');`.
   - Как и строковые действия, они подтягивают свои параметры видимости (`isActive`) из БД.

7. **Где хранятся настройки (Архитектура):**
   - **Дефолтные настройки** зашиты в код фронтенда (`frontend/src/modules/registry/registerDefaultActions.ts`).
   - **Пользовательские изменения** (включение/отключение тумблеров в настройках) уходят на бэкенд и сохраняются в PostgreSQL в таблице `module_settings` (колонка `value` типа JSONB).
   - Хуки `useModuleActions` и `useBulkActions` автоматически под капотом мержат дефолтные настройки из кода и пользовательские переопределения из БД. Разработчику компонента таблицы не нужно делать этот мерж вручную.

8. **UI редактирования настроек:**
   - Для вывода тумблеров системных действий используется компонент `<ModuleActionsSettings moduleId="имя_модуля" />`.
   - Для настройки кастомных быстрых действий используется `<QuickActionEditor />`.
   - Эти компоненты обычно размещаются на странице `[ModuleName]SettingsTab.tsx` во вкладке "Действия".