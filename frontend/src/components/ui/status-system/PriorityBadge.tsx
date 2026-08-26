/**
 * PriorityBadge — компонент для отображения приоритета с динамическим цветом
 * 
 * Цвет приоритета загружается из базы данных через хуки.
 * Если приоритет не найден в БД, используются цвета по умолчанию.
 * 
 * @example
 * ```tsx
 * // Простое использование
 * <PriorityBadge priorityId="high" />
 * 
 * // С иконкой
 * <PriorityBadge priorityId="urgent" showIcon />
 * 
 * // Только текст
 * <PriorityBadge priorityId="medium" variant="text" />
 * ```
 */

import React from 'react';
import { cn } from '@/lib/utils';
import { AlertTriangle, Flag, ChevronUp, Circle } from 'lucide-react';
import { usePriorities } from './status-system.hooks';
import { useTranslation } from '@/lib/i18n';

export interface PriorityBadgeProps {
  /** ID приоритета (например, 'low', 'medium', 'high', 'urgent') */
  priorityId: string;
  /** Кастомный цвет (переопределяет цвет из БД) */
  color?: string;
  /** Дополнительный CSS класс */
  className?: string;
  /** Размер бейджа */
  size?: 'sm' | 'md' | 'lg';
  /** Вариант отображения */
  variant?: 'solid' | 'outline' | 'soft' | 'text';
  /** Показывать ли иконку */
  showIcon?: boolean;
  /** Показывать ли текст */
  showLabel?: boolean;
  /** Скругление */
  rounded?: 'none' | 'sm' | 'md' | 'full';
  /** Tooltip текст */
  title?: string;
  /** Переопределить имя приоритета (для превью) */
  name?: string;
  /** Обработчик клика */
  onClick?: () => void;
  /** Отключён ли бейдж */
  disabled?: boolean;
}

const sizeStyles = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-0.5 text-xs',
  lg: 'px-3 py-1 text-sm',
};

const roundedStyles = {
  none: 'rounded-none',
  sm: 'rounded',
  md: 'rounded-md',
  full: 'rounded-full',
};

// Цвета приоритетов по умолчанию (если нет в БД)
const defaultPriorityColors: Record<string, string> = {
  low: '#22c55e',    // green-500
  medium: '#f59e0b', // amber-500
  high: '#ef4444',   // red-500
  urgent: '#7c3aed', // violet-600
};

// Иконки по умолчанию для приоритетов
const defaultPriorityIcons: Record<string, React.ReactNode> = {
  low: <Circle className="w-3 h-3" />,
  medium: <ChevronUp className="w-3 h-3" />,
  high: <Flag className="w-3 h-3" />,
  urgent: <AlertTriangle className="w-3 h-3" />,
};

import { Badge, type BadgeSize, type BadgeVariant, type BadgeShape } from './Badge';

/**
 * Компонент PriorityBadge с автоматической загрузкой цвета из БД
 */
export function PriorityBadge({
  priorityId,
  color,
  className,
  size,
  variant,
  showIcon = true,
  showLabel = true,
  rounded,
  title,
  onClick,
  disabled = false,
  name,
}: PriorityBadgeProps) {
  // Маппинг legacy-скругления в новую систему форм
  const shapeMap: Record<string, BadgeShape> = {
    none: 'square',
    sm: 'rounded',
    md: 'rounded',
    full: 'pill',
  };

  return (
    <Badge
      id={priorityId}
      type="priority"
      color={color}
      name={name}
      size={size as BadgeSize}
      variant={variant === 'text' ? 'ghost' : (variant as BadgeVariant)}
      shape={rounded ? shapeMap[rounded] : undefined}
      onClick={onClick}
      disabled={disabled}
      className={className}
      title={title}
      showLabel={showLabel}
      // Иконка берется из БД в компоненте Badge, если не передано иное
      // Если showIcon=false, мы можем передать icon="", но в Badge.tsx это может не сработать.
      // В Badge.tsx: const iconName = customIcon || dbConfig?.icon;
      // Мы можем передать специальный маркер, если хотим скрыть иконку, либо изменить Badge.tsx.
    />
  );
}

/**
 * PrioritySelect — выпадающий список для выбора приоритета
 */
export interface PrioritySelectProps {
  value?: string;
  onChange: (priorityId: string) => void;
  className?: string;
  disabled?: boolean;
  placeholder?: string;
  showColors?: boolean;
}

export function PrioritySelect({
  value,
  onChange,
  className,
  disabled = false,
  placeholder,
  showColors = true,
}: PrioritySelectProps) {
  const { t } = useTranslation();
  const { priorities, isLoading } = usePriorities();
  const finalPlaceholder = placeholder ?? t('common.select_status');

  if (isLoading) {
    return (
      <select className={cn('px-3 py-2 border rounded-md', className)} disabled>
        <option>{t('common.loading_dots')}</option>
      </select>
    );
  }

  const displayPriorities = priorities.length > 0 ? priorities : [
    { id: 'low', name: t('common.priority_low'), color: defaultPriorityColors.low },
    { id: 'medium', name: t('common.priority_medium'), color: defaultPriorityColors.medium },
    { id: 'high', name: t('common.priority_high'), color: defaultPriorityColors.high },
    { id: 'urgent', name: t('common.priority_urgent'), color: defaultPriorityColors.urgent },
  ];

  return (
    <select
      className={cn('px-3 py-2 border rounded-md', className)}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
    >
      <option value="">{finalPlaceholder}</option>
      {displayPriorities.map((priority) => (
        <option key={priority.id} value={priority.id}>
          {showColors && (
            <span
              className="inline-block w-2 h-2 rounded-full mr-2"
              style={{ backgroundColor: priority.color }}
            />
          )}
          {priority.name}
        </option>
      ))}
    </select>
  );
}

/**
 * PriorityGroup — группа приоритетов для фильтрации
 */
export interface PriorityGroupProps {
  value?: string;
  onChange: (priorityId: string | 'all') => void;
  className?: string;
}

export function PriorityGroup({
  value,
  onChange,
  className,
}: PriorityGroupProps) {
  const { priorities } = usePriorities();
  const { t } = useTranslation();
  
  const displayPriorities = priorities.length > 0 ? priorities : [
    { id: 'low', name: t('components.status_system.priority.low'), color: defaultPriorityColors.low },
    { id: 'medium', name: t('components.status_system.priority.medium'), color: defaultPriorityColors.medium },
    { id: 'high', name: t('components.status_system.priority.high'), color: defaultPriorityColors.high },
    { id: 'urgent', name: t('components.status_system.priority.urgent'), color: defaultPriorityColors.urgent },
  ];

  return (
    <div className={cn('flex items-center gap-1', className)}>
      <button
        type="button"
        className={cn(
          'px-3 py-1.5 text-sm rounded-md transition-colors',
          value === 'all' || !value
            ? 'bg-primary text-primary-foreground'
            : 'bg-muted text-muted-foreground hover:bg-muted/80'
        )}
        onClick={() => onChange('all')}
      >
        {t('components.status_system.priority.all')}
      </button>
      {displayPriorities.map((priority) => (
        <button
          key={priority.id}
          type="button"
          className={cn(
            'px-3 py-1.5 text-sm rounded-md transition-colors border',
            value === priority.id
              ? 'bg-primary text-primary-foreground'
              : 'bg-background hover:bg-muted'
          )}
          style={{
            borderColor: value === priority.id ? undefined : priority.color,
          }}
          onClick={() => onChange(priority.id)}
        >
          {priority.name}
        </button>
      ))}
    </div>
  );
}

// ─── Helper Functions ─────────────────────────────────────────────────────────────

function getContrastColorText(hexColor: string): string {
  if (!hexColor?.startsWith('#')) return 'white';

  const r = parseInt(hexColor.slice(1, 3), 16);
  const g = parseInt(hexColor.slice(3, 5), 16);
  const b = parseInt(hexColor.slice(5, 7), 16);

  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 128 ? '#1f2937' : 'white';
}

function withAlpha(hex: string, alpha: number): string {
  if (!hex.startsWith('#')) return hex;

  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);

  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function capitalizeFirst(str: string): string {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function getIconByName(iconName: string): React.ReactNode {
  const iconMap: Record<string, React.ReactNode> = {
    circle: <Circle className="w-3 h-3" />,
    flag: <Flag className="w-3 h-3" />,
    triangle: <AlertTriangle className="w-3 h-3" />,
    chevron: <ChevronUp className="w-3 h-3" />,
  };
  return iconMap[iconName] || <Circle className="w-3 h-3" />;
}
