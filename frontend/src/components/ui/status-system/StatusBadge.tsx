/**
 * StatusBadge — компонент для отображения статуса с динамическим цветом
 * 
 * Цвет статуса загружается из базы данных через хуки.
 * Если цвет не найден, используется цвет по умолчанию.
 * 
 * @example
 * ```tsx
 * // Простое использование
 * <StatusBadge statusId="active" />
 * 
 * // С кастомным цветом (переопределение)
 * <StatusBadge statusId="active" color="#10b981" />
 * 
 * // Без текста, только индикатор
 * <StatusBadge statusId="active" showLabel={false} />
 * ```
 */

import React from 'react';
import { cn } from '@/lib/utils';
import { useStatuses } from './status-system.hooks';
import type { StatusId } from './types';
import { useTranslation } from '@/lib/i18n';

export interface StatusBadgeProps {
  /** ID статуса (например, 'active', 'pending') */
  statusId: StatusId;
  /** Кастомный цвет (переопределяет цвет из БД) */
  color?: string;
  /** Показывать ли текст статуса */
  showLabel?: boolean;
  /** Дополнительный CSS класс */
  className?: string;
  /** Размер бейджа */
  size?: 'sm' | 'md' | 'lg';
  /** Вариант отображения */
  variant?: 'solid' | 'outline' | 'soft';
  /** Скругление */
  rounded?: 'none' | 'sm' | 'md' | 'full';
  /** Иконка слева (опционально) */
  icon?: React.ReactNode;
  /** Tooltip текст (опционально) */
  title?: string;
  /** Переопределить имя статуса (для превью) */
  name?: string;
  /** Обработчик клика (опционально) */
  onClick?: () => void;
  /** Идентификатор модуля */
  module?: string;
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

import { Badge, type BadgeSize, type BadgeVariant, type BadgeShape } from './Badge';

/**
 * Компонент StatusBadge с автоматической загрузкой цвета из БД
 */
export function StatusBadge({
  statusId,
  color,
  showLabel = true,
  className,
  size,
  variant,
  rounded,
  icon,
  title,
  onClick,
  name,
  module,
}: StatusBadgeProps) {
  // Маппинг legacy-скругления в новую систему форм
  const shapeMap: Record<string, BadgeShape> = {
    none: 'square',
    sm: 'rounded',
    md: 'rounded',
    full: 'pill',
  };

  return (
    <Badge
      id={statusId}
      type="status"
      module={module}
      color={color}
      name={name}
      size={size as BadgeSize}
      variant={variant as BadgeVariant}
      shape={rounded ? shapeMap[rounded] : undefined}
      onClick={onClick}
      className={className}
      title={title}
      showDot={!showLabel} // Если метка скрыта, показываем точку
      showLabel={showLabel}
    />
  );
}

/**
 * StatusDot — только индикатор статуса (точка)
 */
export interface StatusDotProps {
  statusId: StatusId;
  color?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  title?: string;
}

export function StatusDot({
  statusId,
  color: customColor,
  className,
  size = 'md',
  title,
}: StatusDotProps) {
  const { getStatusDisplay } = useStatuses();
  const displayConfig = getStatusDisplay(statusId);

  const color = customColor || displayConfig?.color || '#6b7280';

  const sizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-2.5 h-2.5',
    lg: 'w-3 h-3',
  };

  return (
    <span
      className={cn(
        'inline-block rounded-full shrink-0',
        sizeClasses[size],
        className
      )}
      style={{ backgroundColor: color }}
      title={title || displayConfig?.name || statusId}
    />
  );
}

/**
 * StatusSelect — выпадающий список для выбора статуса
 */
export interface StatusSelectProps {
  value?: StatusId;
  onChange: (statusId: StatusId) => void;
  module?: string;
  className?: string;
  disabled?: boolean;
  placeholder?: string;
}

export function StatusSelect({
  value,
  onChange,
  module,
  className,
  disabled = false,
  placeholder,
}: StatusSelectProps) {
  const { t } = useTranslation();
  const { statuses, isLoading } = useStatuses({ module });
  const finalPlaceholder = placeholder ?? t('common.select_status');

  if (isLoading) {
    return (
      <select className={cn('px-3 py-2 border rounded-md', className)} disabled>
        <option>{t('common.loading_dots')}</option>
      </select>
    );
  }

  return (
    <select
      className={cn('px-3 py-2 border rounded-md', className)}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
    >
      <option value="">{finalPlaceholder}</option>
      {statuses.map((status) => (
        <option key={status.id} value={status.id}>
          {status.name}
        </option>
      ))}
    </select>
  );
}

// ─── Helper Functions ─────────────────────────────────────────────────────────────

/**
 * Получить контрастный цвет текста для заданного фона
 */
function getContrastColorText(hexColor: string): string {
  if (!hexColor?.startsWith('#')) return 'white';

  const r = parseInt(hexColor.slice(1, 3), 16);
  const g = parseInt(hexColor.slice(3, 5), 16);
  const b = parseInt(hexColor.slice(5, 7), 16);

  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 128 ? '#1f2937' : 'white';
}

/**
 * Добавить alpha-канал к HEX цвету
 */
function withAlpha(hex: string, alpha: number): string {
  if (!hex.startsWith('#')) return hex;

  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);

  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
