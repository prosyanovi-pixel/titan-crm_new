/**
 * OutcomeBadge — компонент для отображения результата судебного дела
 *
 * Цвет результата загружается из базы данных через хуки.
 *
 * @example
 * ```tsx
 * // Простое использование
 * <OutcomeBadge outcomeId="won" />
 *
 * // С кастомным цветом
 * <OutcomeBadge outcomeId="won" color="#10b981" />
 *
 * // Без текста
 * <OutcomeBadge outcomeId="won" showLabel={false} />
 * ```
 */

import React from 'react';
import { cn } from '@/lib/utils';
import { useOutcomes } from './status-system.hooks';
import { Trophy } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';

export interface OutcomeBadgeProps {
  /** ID результата (например, 'won', 'won_partial', 'lost') */
  outcomeId?: string;
  /** Кастомный цвет (переопределяет цвет из БД) */
  color?: string;
  /** Показывать ли текст результата */
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
  /** Переопределить имя (для превью) */
  name?: string;
  /** Обработчик клика (опционально) */
  onClick?: () => void;
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
 * Компонент OutcomeBadge с автоматической загрузкой цвета из БД
 */
export function OutcomeBadge({
  outcomeId,
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
}: OutcomeBadgeProps) {
  // Маппинг legacy-скругления в новую систему форм
  const shapeMap: Record<string, BadgeShape> = {
    none: 'square',
    sm: 'rounded',
    md: 'rounded',
    full: 'pill',
  };

  if (!outcomeId) {
    return null;
  }

  return (
    <Badge
      id={outcomeId}
      type="outcome"
      color={color}
      name={name}
      size={size as BadgeSize}
      variant={variant as BadgeVariant}
      shape={rounded ? shapeMap[rounded] : undefined}
      onClick={onClick}
      className={className}
      title={title}
      showDot={!showLabel}
      showLabel={showLabel}
    />
  );
}

/**
 * OutcomeDot — маленькая цветная точка для отображения результата
 */
export interface OutcomeDotProps {
  outcomeId?: string;
  color?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  title?: string;
}

const dotSizes = {
  sm: 'w-2 h-2',
  md: 'w-2.5 h-2.5',
  lg: 'w-3 h-3',
};

export function OutcomeDot({
  outcomeId,
  color: customColor,
  className,
  size = 'md',
  title,
}: OutcomeDotProps) {
  const { getOutcomeById } = useOutcomes();
  const outcome = outcomeId ? getOutcomeById(outcomeId) : null;
  const displayColor = customColor || outcome?.color || '#6B7280';

  return (
    <span
      className={cn('inline-block rounded-full', dotSizes[size], className)}
      style={{ backgroundColor: displayColor }}
      title={title || outcome?.name || outcomeId}
    />
  );
}

/**
 * OutcomeSelect — select для выбора результата
 */
export interface OutcomeSelectProps {
  value?: string;
  onChange?: (value: string) => void;
  className?: string;
  placeholder?: string;
  disabled?: boolean;
}

export function OutcomeSelect({
  value,
  onChange,
  className,
  placeholder,
  disabled,
}: OutcomeSelectProps) {
  const { outcomes, isLoading } = useOutcomes();
  const { t } = useTranslation();
  const finalPlaceholder = placeholder || t('components.status_system.outcome.placeholder');

  return (
    <select
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
      className={cn(
        'block w-full rounded-md border-border bg-background px-3 py-2 text-sm',
        'focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring',
        className
      )}
      disabled={disabled || isLoading}
    >
      <option value="">{finalPlaceholder}</option>
      {outcomes.map((outcome) => (
        <option key={outcome.id} value={outcome.id}>
          {outcome.name}
        </option>
      ))}
    </select>
  );
}
