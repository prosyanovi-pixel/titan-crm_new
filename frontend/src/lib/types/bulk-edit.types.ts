/**
 * Типы для настроек полей массового редактирования (Bulk Edit)
 */

/** Тип поля для массового редактирования */
export type BulkEditFieldType = 
  | 'select'           // Выпадающий список (статусы, приоритеты и т.д.)
  | 'combobox'         // Combobox с поиском (контрагенты, пользователи)
  | 'text'             // Текстовое поле
  | 'number'           // Числовое поле
  | 'date'             // Дата
  | 'boolean'          // Булево значение
  | 'tags';            // Теги

/** Конфигурация поля для массового редактирования */
export interface BulkEditFieldConfig {
  /** Уникальный идентификатор поля (ключ в объекте записи) */
  id: string;
  /** Отображаемое название поля */
  label: string;
  /** Тип редактора */
  type: BulkEditFieldType;
  /** Источник данных для select/combobox (опционально) */
  dataSource?: string;  // Например: 'statuses', 'priorities', 'users', 'contractors'
  /** Модуль для данных (опционально) */
  dataSourceModule?: string;  // Например: 'contractors', 'lawyers'
  /** Порядок отображения */
  order: number;
  /** Включено ли поле */
  enabled: boolean;
  /** Обязательно ли поле для заполнения */
  required?: boolean;
  /** Описание поля (подсказка) */
  description?: string;
  /** Дополнительные параметры */
  params?: Record<string, unknown>;
}

/** Настройки массового редактирования для модуля */
export interface ModuleBulkEditSettings {
  /** ID модуля (например: 'contractors', 'projects', 'cases') */
  moduleId: string;
  /** Название модуля */
  moduleName: string;
  /** Поля для массового редактирования */
  fields: BulkEditFieldConfig[];
  /** Включено ли массовое редактирование для модуля */
  enabled: boolean;
  /** Дата последнего обновления */
  updatedAt?: string;
}

/** Пропсы для компонента настройки полей BulkEdit */
export interface BulkEditSettingsEditorProps {
  /** ID модуля */
  moduleId: string;
  /** Название модуля */
  moduleName?: string;
  /** Текущие настройки */
  settings?: ModuleBulkEditSettings;
  /** Callback сохранения настроек */
  onSave: (settings: ModuleBulkEditSettings) => void;
  /** Доступные типы полей */
  availableFieldTypes?: BulkEditFieldType[];
  /** Доступные источники данных */
  availableDataSources?: Array<{ id: string; name: string }>;
}

/** Поля доступные для настройки по умолчанию для каждого модуля */
export const DEFAULT_BULK_EDIT_FIELDS: Record<string, BulkEditFieldConfig[]> = {
  contractors: [
    { id: 'status', label: 'Статус', type: 'select', dataSource: 'statuses', dataSourceModule: 'contractors', order: 1, enabled: true },
    { id: 'type', label: 'Тип отношения', type: 'select', dataSource: 'relationshipTypes', dataSourceModule: 'contractors', order: 2, enabled: true },
    { id: 'legalForm', label: 'Правовая форма', type: 'select', dataSource: 'legalForms', order: 3, enabled: true },
    { id: 'manager', label: 'Менеджер', type: 'combobox', dataSource: 'users', order: 4, enabled: true },
    { id: 'tags', label: 'Теги', type: 'tags', dataSource: 'tags', order: 5, enabled: true },
  ],
  projects: [
    { id: 'status', label: 'Статус', type: 'select', dataSource: 'statuses', dataSourceModule: 'projects', order: 1, enabled: true },
    { id: 'priority', label: 'Приоритет', type: 'select', dataSource: 'priorities', dataSourceModule: 'projects', order: 2, enabled: true },
    { id: 'manager', label: 'Менеджер', type: 'combobox', dataSource: 'users', order: 3, enabled: true },
  ],
  cases: [
    { id: 'status', label: 'Статус', type: 'select', dataSource: 'statuses', dataSourceModule: 'cases', order: 1, enabled: true },
    { id: 'lawyerId', label: 'Юрист', type: 'combobox', dataSource: 'users', order: 2, enabled: true },
    { id: 'client', label: 'Клиент', type: 'combobox', dataSource: 'contractors', order: 3, enabled: true },
    { id: 'plaintiff', label: 'Истец', type: 'text', order: 4, enabled: true },
    { id: 'defendant', label: 'Ответчик', type: 'text', order: 5, enabled: true },
    { id: 'outcome', label: 'Результат', type: 'select', dataSource: 'outcomes', order: 6, enabled: true },
    { id: 'courtName', label: 'Суд', type: 'text', order: 7, enabled: true },
    { id: 'judge', label: 'Судья', type: 'text', order: 8, enabled: true },
    { id: 'deadline', label: 'Дедлайн', type: 'date', order: 9, enabled: true },
    { id: 'tags', label: 'Теги', type: 'tags', dataSource: 'tags', order: 10, enabled: true },
  ],
  tasks: [
    { id: 'status', label: 'Статус', type: 'select', dataSource: 'statuses', dataSourceModule: 'tasks', order: 1, enabled: true },
    { id: 'priority', label: 'Приоритет', type: 'select', dataSource: 'priorities', dataSourceModule: 'tasks', order: 2, enabled: true },
    { id: 'manager', label: 'Исполнитель', type: 'combobox', dataSource: 'users', order: 3, enabled: true },
    { id: 'folderId', label: 'Папка', type: 'select', dataSource: 'folders', order: 4, enabled: true },
    { id: 'tags', label: 'Теги', type: 'tags', dataSource: 'tags', order: 5, enabled: true },
  ],
  documents: [
    { id: 'folderId', label: 'Папка', type: 'select', dataSource: 'folders', order: 1, enabled: true },
    { id: 'status', label: 'Статус', type: 'select', dataSource: 'statuses', dataSourceModule: 'documents', order: 2, enabled: true },
    { id: 'tags', label: 'Теги', type: 'tags', dataSource: 'tags', order: 3, enabled: true },
  ],
  mail: [
    { id: 'folderId', label: 'Папка', type: 'select', dataSource: 'folders', order: 1, enabled: true },
    { id: 'status', label: 'Статус', type: 'select', dataSource: 'statuses', dataSourceModule: 'mail', order: 2, enabled: true },
    { id: 'tags', label: 'Теги', type: 'tags', dataSource: 'tags', order: 3, enabled: true },
  ],
  lawyers: [
    { id: 'status', label: 'Статус', type: 'select', dataSource: 'statuses', dataSourceModule: 'lawyers', order: 1, enabled: true },
    { id: 'priority', label: 'Приоритет', type: 'select', dataSource: 'priorities', dataSourceModule: 'lawyers', order: 2, enabled: true },
    { id: 'lawyerId', label: 'Юрист', type: 'combobox', dataSource: 'users', order: 3, enabled: true },
    { id: 'outcome', label: 'Результат', type: 'select', dataSource: 'outcomes', order: 4, enabled: true },
    { id: 'tags', label: 'Теги', type: 'tags', dataSource: 'tags', order: 5, enabled: true },
  ],
  calendar: [
    { id: 'status', label: 'Статус', type: 'select', dataSource: 'statuses', dataSourceModule: 'calendar', order: 1, enabled: true },
    { id: 'manager', label: 'Ответственный', type: 'combobox', dataSource: 'users', order: 2, enabled: true },
    { id: 'tags', label: 'Теги', type: 'tags', dataSource: 'tags', order: 3, enabled: true },
  ],
  finance: [
    { id: 'status', label: 'Статус', type: 'select', dataSource: 'statuses', dataSourceModule: 'finance', order: 1, enabled: true },
    { id: 'priority', label: 'Приоритет', type: 'select', dataSource: 'priorities', dataSourceModule: 'finance', order: 2, enabled: true },
    { id: 'manager', label: 'Менеджер', type: 'combobox', dataSource: 'users', order: 3, enabled: true },
    { id: 'tags', label: 'Теги', type: 'tags', dataSource: 'tags', order: 4, enabled: true },
  ],
  contracts: [
    { id: 'status', label: 'Статус', type: 'select', dataSource: 'statuses', dataSourceModule: 'contracts', order: 1, enabled: true },
    { id: 'manager', label: 'Менеджер', type: 'combobox', dataSource: 'users', order: 2, enabled: true },
    { id: 'tags', label: 'Теги', type: 'tags', dataSource: 'tags', order: 3, enabled: true },
  ],
  products: [
    { id: 'status', label: 'Статус', type: 'select', dataSource: 'statuses', dataSourceModule: 'products', order: 1, enabled: true },
    { id: 'type', label: 'Тип', type: 'select', dataSource: 'types', dataSourceModule: 'products', order: 2, enabled: true },
    { id: 'category_id', label: 'Категория', type: 'select', dataSource: 'productCategories', order: 3, enabled: true },
    { id: 'tags', label: 'Теги', type: 'tags', dataSource: 'tags', order: 4, enabled: true },
  ],
  services: [
    { id: 'status', label: 'Статус', type: 'select', dataSource: 'statuses', dataSourceModule: 'services', order: 1, enabled: true },
    { id: 'type', label: 'Тип', type: 'select', dataSource: 'types', dataSourceModule: 'services', order: 2, enabled: true },
    { id: 'category_id', label: 'Категория', type: 'select', dataSource: 'serviceCategories', order: 3, enabled: true },
    { id: 'tags', label: 'Теги', type: 'tags', dataSource: 'tags', order: 4, enabled: true },
  ],
  warehouse: [
    { id: 'status', label: 'Статус', type: 'select', dataSource: 'statuses', dataSourceModule: 'warehouse', order: 1, enabled: true },
    { id: 'type', label: 'Тип', type: 'select', dataSource: 'types', dataSourceModule: 'warehouse', order: 2, enabled: true },
    { id: 'tags', label: 'Теги', type: 'tags', dataSource: 'tags', order: 3, enabled: true },
  ],
};

/** Получить настройки по умолчанию для модуля */
export function getDefaultBulkEditSettings(moduleId: string): ModuleBulkEditSettings | null {
  const fields = DEFAULT_BULK_EDIT_FIELDS[moduleId];
  if (!fields) return null;

  const moduleNames: Record<string, string> = {
    contractors: 'Контрагенты',
    projects: 'Проекты',
    cases: 'Дела',
    tasks: 'Задачи',
    documents: 'Документы',
    mail: 'Почта',
    finance: 'Финансы',
    lawyers: 'Юристы',
    calendar: 'Календарь',
    contracts: 'Договоры',
    products: 'Товары',
    services: 'Услуги',
    warehouse: 'Склад',
  };

  return {
    moduleId,
    moduleName: moduleNames[moduleId] || moduleId,
    fields: [...fields],
    enabled: true,
    updatedAt: new Date().toISOString(),
  };
}
