/**
 * Типы для системы управления статусами, тегами и приоритетами
 * 
 * Все настройки хранятся в базе данных и могут быть изменены через Settings
 */

// ─── Badge Style Types ─────────────────────────────────────────────────────────────

export type BadgeVariant = 'solid' | 'soft' | 'outline' | 'ghost' | 'secondary';
export type BadgeSize = 'xs' | 'sm' | 'md' | 'lg';
export type BadgeShape =
  | 'square'      // острые углы
  | 'rounded'     // легкое скругление
  | 'pill'        // полностью круглый
  | 'left-pill'   // левый край круглый, правый острый
  | 'right-pill'  // правый край круглый, левый острый
  | 'top-pill'    // верх круглый, низ острый
  | 'bottom-pill' // низ круглый, верх острый
  | 'bubble'      // пузырёк
  | 'stadium';    // вытянутый овал

// ─── Status Types ─────────────────────────────────────────────────────────────

/**
 * Базовый статус системы
 */
export interface Status {
  /** Уникальный ID статуса */
  id: string;
  /** Отображаемое имя */
  name: string;
  /** HEX цвет (#RRGGBB) */
  color: string;
  /** Описание статуса */
  description?: string;
  /** Порядок сортировки */
  order?: number;
  /** Модуль, к которому относится статус */
  module?: string;
  /** Активен ли статус */
  isActive?: boolean;
  /** Иконка статуса (опционально) */
  icon?: string;
  /** Стиль бейджа: вариант */
  variant?: BadgeVariant;
  /** Стиль бейджа: размер */
  size?: BadgeSize;
  /** Стиль бейджа: форма */
  shape?: BadgeShape;
  /** Эффект стекла */
  isGlass?: boolean;
  /** Градиент */
  isGradient?: boolean;
  /** Второй цвет для градиента */
  secondaryColor?: string;
  /** Анимация */
  isAnimated?: boolean;
}

/**
 * Предопределённые ID статусов для консистентности в коде
 */
export type StatusId = 
  | 'active'
  | 'pending'
  | 'paused'
  | 'completed'
  | 'cancelled'
  | 'vip'
  | 'finished'
  | 'default'
  | string;

// ─── Tag Types ─────────────────────────────────────────────────────────────

/**
 * Тег для маркировки сущностей
 */
export interface Tag {
  /** Уникальный ID тега */
  id: string;
  /** Название тега */
  name: string;
  /** HEX цвет (#RRGGBB) */
  color: string;
  /** Описание тега */
  description?: string;
  /** Модуль, к которому относится тег */
  module?: string;
  /** Категория тега (опционально) */
  category?: string;
  /** Активен ли тег */
  isActive?: boolean;
  /** Стиль бейджа: вариант */
  variant?: BadgeVariant;
  /** Стиль бейджа: размер */
  size?: BadgeSize;
  /** Стиль бейджа: форма */
  shape?: BadgeShape;
  /** Иконка */
  icon?: string;
  /** Эффект стекла */
  isGlass?: boolean;
  /** Градиент */
  isGradient?: boolean;
  /** Второй цвет для градиента */
  secondaryColor?: string;
  /** Анимация */
  isAnimated?: boolean;
}

// ─── Priority Types ─────────────────────────────────────────────────────────────

/**
 * Приоритет задачи/проекта
 */
export interface Priority {
  /** Уникальный ID приоритета */
  id: string;
  /** Отображаемое имя */
  name: string;
  /** HEX цвет (#RRGGBB) */
  color: string;
  /** Описание приоритета */
  description?: string;
  /** Уровень приоритета (0 - минимальный) */
  level: number;
  /** Иконка приоритета (опционально) */
  icon?: string;
  /** Стиль бейджа: вариант */
  variant?: BadgeVariant;
  /** Стиль бейджа: размер */
  size?: BadgeSize;
  /** Стиль бейджа: форма */
  shape?: BadgeShape;
  /** Эффект стекла */
  isGlass?: boolean;
  /** Градиент */
  isGradient?: boolean;
  /** Второй цвет для градиента */
  secondaryColor?: string;
  /** Анимация */
  isAnimated?: boolean;
}

/**
 * Предопределённые уровни приоритетов
 */
export type PriorityLevel = 'low' | 'medium' | 'high' | 'urgent';

// ─── Display Config Types ─────────────────────────────────────────────────────────────

/**
 * Конфигурация для отображения статуса/тега/приоритета
 * Используется компонентами для рендеринга
 */
export interface DisplayConfig {
  /** ID сущности */
  id: string;
  /** Отображаемое имя */
  name: string;
  /** HEX цвет (#RRGGBB) */
  color: string;
  /** Контрастный цвет текста (вычисляется автоматически) */
  textColor: string;
  /** Полупрозрачный фон (вычисляется автоматически) */
  backgroundColor: string;
  /** Полупрозрачная рамка (вычисляется автоматически) */
  borderColor: string;
  /** Иконка (опционально) */
  icon?: string;
  /** Описание (опционально) */
  description?: string;
  /** Стиль бейджа: вариант */
  variant?: BadgeVariant;
  /** Стиль бейджа: размер */
  size?: BadgeSize;
  /** Стиль бейджа: форма */
  shape?: BadgeShape;
  /** Эффект стекла */
  isGlass?: boolean;
  /** Градиент */
  isGradient?: boolean;
  /** Второй цвет для градиента */
  secondaryColor?: string;
  /** Анимация */
  isAnimated?: boolean;
}

// ─── API Request/Response Types ─────────────────────────────────────────────────────────────

/**
 * Запрос на создание/обновление статуса
 */
export interface StatusCreateRequest {
  name: string;
  color: string;
  description?: string;
  module?: string;
  order?: number;
  icon?: string;
  variant?: BadgeVariant;
  size?: BadgeSize;
  shape?: BadgeShape;
  isGlass?: boolean;
  isGradient?: boolean;
  secondaryColor?: string;
  isAnimated?: boolean;
}

export interface StatusUpdateRequest {
  id: string;
  name?: string;
  color?: string;
  description?: string;
  order?: number;
  icon?: string;
  isActive?: boolean;
  variant?: BadgeVariant;
  size?: BadgeSize;
  shape?: BadgeShape;
  isGlass?: boolean;
  isGradient?: boolean;
  secondaryColor?: string;
  isAnimated?: boolean;
}

/**
 * Запрос на создание/обновление тега
 */
export interface TagCreateRequest {
  name: string;
  color: string;
  description?: string;
  module?: string;
  category?: string;
  variant?: BadgeVariant;
  size?: BadgeSize;
  shape?: BadgeShape;
  icon?: string;
  isGlass?: boolean;
  isGradient?: boolean;
  secondaryColor?: string;
  isAnimated?: boolean;
}

export interface TagUpdateRequest {
  id: string;
  name?: string;
  color?: string;
  description?: string;
  category?: string;
  isActive?: boolean;
  variant?: BadgeVariant;
  size?: BadgeSize;
  shape?: BadgeShape;
  icon?: string;
  isGlass?: boolean;
  isGradient?: boolean;
  secondaryColor?: string;
  isAnimated?: boolean;
}

/**
 * Запрос на создание/обновление приоритета
 */
export interface PriorityCreateRequest {
  name: string;
  color: string;
  level: number;
  description?: string;
  icon?: string;
  variant?: BadgeVariant;
  size?: BadgeSize;
  shape?: BadgeShape;
  isGlass?: boolean;
  isGradient?: boolean;
  secondaryColor?: string;
  isAnimated?: boolean;
}

export interface PriorityUpdateRequest {
  id: string;
  name?: string;
  color?: string;
  level?: number;
  description?: string;
  icon?: string;
  variant?: BadgeVariant;
  size?: BadgeSize;
  shape?: BadgeShape;
  isGlass?: boolean;
  isGradient?: boolean;
  secondaryColor?: string;
  isAnimated?: boolean;
}

// ─── Outcome Types ─────────────────────────────────────────────────────────────

/**
 * Результат судебного дела (outcome)
 */
export interface Outcome {
  /** Уникальный ID результата */
  id: string;
  /** Отображаемое имя */
  name: string;
  /** HEX цвет (#RRGGBB) */
  color: string;
  /** Описание результата */
  description?: string;
  /** Порядок сортировки */
  order?: number;
  /** Активен ли результат */
  isActive?: boolean;
  /** Стиль бейджа: вариант */
  variant?: BadgeVariant;
  /** Стиль бейджа: размер */
  size?: BadgeSize;
  /** Стиль бейджа: форма */
  shape?: BadgeShape;
  /** Дата создания */
  createdAt?: string;
  /** Дата обновления */
  updatedAt?: string;
  /** Иконка */
  icon?: string;
  /** Эффект стекла */
  isGlass?: boolean;
  /** Градиент */
  isGradient?: boolean;
  /** Второй цвет для градиента */
  secondaryColor?: string;
  /** Анимация */
  isAnimated?: boolean;
}

/**
 * Запрос на создание/обновление результата
 */
export interface OutcomeCreateRequest {
  name: string;
  color?: string;
  order?: number;
  description?: string;
  isActive?: boolean;
  variant?: BadgeVariant;
  size?: BadgeSize;
  shape?: BadgeShape;
  icon?: string;
  isGlass?: boolean;
  isGradient?: boolean;
  secondaryColor?: string;
  isAnimated?: boolean;
}

export interface OutcomeUpdateRequest {
  id: string;
  name?: string;
  color?: string;
  order?: number;
  description?: string;
  isActive?: boolean;
  variant?: BadgeVariant;
  size?: BadgeSize;
  shape?: BadgeShape;
  icon?: string;
  isGlass?: boolean;
  isGradient?: boolean;
  secondaryColor?: string;
  isAnimated?: boolean;
}

/**
 * Ответ API со списком сущностей
 */
export interface EntitiesResponse<T> {
  items: T[];
  total: number;
}

// ─── Helper Types ─────────────────────────────────────────────────────────────

/**
 * Тип для хука использования статусов
 */
export interface UseStatusesResult {
  statuses: Status[];
  isLoading: boolean;
  error: Error | null;
  getStatusById: (id: string) => Status | undefined;
  getStatusDisplay: (id: string) => DisplayConfig | undefined;
  refetch: () => void;
}

/**
 * Тип для хука использования тегов
 */
export interface UseTagsResult {
  tags: Tag[];
  isLoading: boolean;
  error: Error | null;
  getTagById: (id: string) => Tag | undefined;
  getTagDisplay: (id: string) => DisplayConfig | undefined;
  refetch: () => void;
}

/**
 * Тип для хука использования приоритетов
 */
export interface UsePrioritiesResult {
  priorities: Priority[];
  isLoading: boolean;
  error: Error | null;
  getPriorityById: (id: string) => Priority | undefined;
  getPriorityDisplay: (id: string) => DisplayConfig | undefined;
  refetch: () => void;
}
