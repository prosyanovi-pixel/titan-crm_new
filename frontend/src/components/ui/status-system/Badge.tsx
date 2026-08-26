import React from 'react';
import { cn } from '@/lib/utils';
import { getContrastColor, withAlpha } from '@/lib/color';
import { useStatuses, usePriorities, useTags, useOutcomes } from './status-system.hooks';
import type { DisplayConfig, BadgeVariant as BadgeVariantType, BadgeShape as BadgeShapeType, StatusUpdateRequest, TagUpdateRequest, PriorityUpdateRequest, OutcomeUpdateRequest } from './types';
import * as LucideIcons from 'lucide-react';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { useTranslation } from '@/lib/i18n';
import { Palette } from 'lucide-react';
import { useUpdateStatus, useUpdateTag, useUpdatePriority, useUpdateOutcome } from './status-system.hooks';

// ============================================================
// ТИПЫ
// ============================================================

export type BadgeType = 'status' | 'priority' | 'tag' | 'outcome';
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

// ============================================================
// КОНФИГУРАЦИЯ СТИЛЕЙ
// ============================================================

const sizeConfig: Record<BadgeSize, string> = {
  xs: 'px-1.5 py-0.5 text-[10px]',
  sm: 'px-2 py-0.5 text-[11px]',
  md: 'px-2.5 py-1 text-xs',
  lg: 'px-3 py-1.5 text-sm',
};

const iconSizeConfig: Record<BadgeSize, number> = {
  xs: 10,
  sm: 12,
  md: 14,
  lg: 16,
};

const shapeConfig: Record<BadgeShape, string> = {
  square: 'rounded-none',
  rounded: 'rounded-md',
  pill: 'rounded-full',
  'left-pill': 'rounded-l-full rounded-r-md',
  'right-pill': 'rounded-r-full rounded-l-md',
  'top-pill': 'rounded-t-full rounded-b-md',
  'bottom-pill': 'rounded-b-full rounded-t-md',
  bubble: 'rounded-2xl rounded-bl-md',
  stadium: 'rounded-[60px]',
};

// ============================================================
// ХЕЛПЕРЫ
// ============================================================

/**
 * Safely retrieves a Lucide icon component by name
 */
const getIcon = (name: string): React.ComponentType<{ size?: number; className?: string; strokeWidth?: number }> | null => {
  const icon = (LucideIcons as Record<string, unknown>)[name];
  if (typeof icon === 'function' || (typeof icon === 'object' && icon !== null)) {
    return icon as React.ComponentType<{ size?: number; className?: string; strokeWidth?: number }>;
  }
  return null;
};

// (используем импортированные getContrastColor и withAlpha)

// ============================================================
// ОСНОВНОЙ КОМПОНЕНТ
// ============================================================

const LucideIconRenderer = ({ name, size, className, strokeWidth }: { name: string; size?: number; className?: string; strokeWidth?: number }) => {
  const Icon = getIcon(name);
  if (!Icon) return null;
  return React.createElement(Icon, { size, className, strokeWidth });
};

export interface BadgeProps {
  /** ID в БД (статуса/приоритета/тега/исхода) */
  id: string;
  /** Тип: статус, приоритет, тег или исход */
  type?: BadgeType;
  
  // Переопределение данных (если нужно перебить БД)
  name?: string;
  color?: string;
  
  // Визуальные настройки
  variant?: BadgeVariant;
  size?: BadgeSize;
  shape?: BadgeShape;
  
  // Поведение
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  title?: string;
  
  // Дополнительно
  showDot?: boolean;      // показать точку слева
  uppercase?: boolean;    // текст заглавными
  noWrap?: boolean;       // запрет переноса
  module?: string;        // Модуль (для устранения коллизий ID)
  
  // Новые расширенные настройки
  icon?: string;
  isGlass?: boolean;
  isGradient?: boolean;
  secondaryColor?: string;
  isAnimated?: boolean;
  children?: React.ReactNode;
  showLabel?: boolean;
  allowStyleEdit?: boolean;
}

/**
 * Универсальный Badge для статусов, приоритетов, тегов и исходов
 */
export function Badge({
  id,
  type = 'status',
  module,
  name: customName,
  color: customColor,
  variant: customVariant,
  size: customSize,
  shape: customShape,
  onClick,
  disabled = false,
  className = '',
  title,
  showDot = false,
  uppercase = false,
  noWrap = true,
  icon: customIcon,
  isGlass: customIsGlass,
  isGradient: customIsGradient,
  secondaryColor: customSecondaryColor,
  isAnimated: customIsAnimated,
  children,
  showLabel = true,
  allowStyleEdit = false,
}: BadgeProps) {
  
  // Используем хуки для получения данных из БД
  const { getStatusDisplay } = useStatuses();
  const { getPriorityDisplay } = usePriorities();
  const { getTagDisplay } = useTags();
  const { getOutcomeDisplay } = useOutcomes();

  const getDisplayConfig = (): DisplayConfig | undefined => {
    switch (type) {
      case 'status':
        return getStatusDisplay(id, module);
      case 'priority':
        return getPriorityDisplay(id);
      case 'tag':
        return getTagDisplay(id, module);
      case 'outcome':
        return getOutcomeDisplay(id);
      default:
        return undefined;
    }
  };

  const dbConfig = getDisplayConfig();
  const displayName = customName || dbConfig?.name || id;
  const displayColor = customColor || dbConfig?.color || '#6b7280';
  
  // Приоритет: пропсы (если переданы) -> БД -> значения по умолчанию
  const displayVariant = customVariant || dbConfig?.variant || 'soft';
  const displaySize = customSize || dbConfig?.size || 'md';
  const displayShape = customShape || dbConfig?.shape || 'pill';

  // Расширенные настройки
  const iconName = customIcon || dbConfig?.icon;
  const isGlass = customIsGlass !== undefined ? customIsGlass : (dbConfig?.isGlass || false);
  const isGradient = customIsGradient !== undefined ? customIsGradient : (dbConfig?.isGradient || false);
  const secondaryColor = customSecondaryColor || dbConfig?.secondaryColor || displayColor;
  const isAnimated = customIsAnimated !== undefined ? customIsAnimated : (dbConfig?.isAnimated || false);

  // ============================================================
  // ВЫЧИСЛЕНИЕ СТИЛЕЙ
  // ============================================================
  
  const getStyles = () => {
    const textColor = displayVariant === 'solid' ? getContrastColor(displayColor) : displayColor;
    
    let baseStyles: React.CSSProperties;

    switch (displayVariant) {
      case 'solid':
        baseStyles = {
          backgroundColor: displayColor,
          color: textColor,
          border: 'none',
        };
        if (isGradient) {
          baseStyles.backgroundImage = `linear-gradient(135deg, ${displayColor}, ${secondaryColor})`;
        }
        break;
      case 'outline':
        baseStyles = {
          backgroundColor: 'transparent',
          color: displayColor,
          border: `1.5px solid ${displayColor}`,
        };
        if (isGradient) {
          // Для outline градиент сложнее, сделаем градиентный текст
          baseStyles.backgroundImage = `linear-gradient(135deg, ${displayColor}, ${secondaryColor})`;
          baseStyles.WebkitBackgroundClip = 'text';
          baseStyles.WebkitTextFillColor = 'transparent';
          baseStyles.borderImageSource = `linear-gradient(135deg, ${displayColor}, ${secondaryColor})`;
          baseStyles.borderImageSlice = 1;
        }
        break;
      case 'ghost':
        baseStyles = {
          backgroundColor: 'transparent',
          color: displayColor,
          border: 'none',
        };
        break;
      case 'soft':
      default: {
        const alpha = isGlass ? 0.05 : 0.12;
        const borderAlpha = isGlass ? 0.2 : 0.3;
        
        baseStyles = {
          backgroundColor: withAlpha(displayColor, alpha),
          color: displayColor,
          border: `1px solid ${withAlpha(displayColor, borderAlpha)}`,
        };
        
        if (isGradient) {
          baseStyles.backgroundImage = `linear-gradient(135deg, ${withAlpha(displayColor, alpha)}, ${withAlpha(secondaryColor, alpha)})`;
        }
        
        if (isGlass) {
          baseStyles.backdropFilter = 'blur(8px)';
          baseStyles.WebkitBackdropFilter = 'blur(8px)';
        }
        break;
      }
    }

    return baseStyles;
  };

  const styles = getStyles();
  const isInteractive = !!onClick && !disabled;


  // ============================================================
  // РЕНДЕР
  // ============================================================
  
  const content = (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 font-medium transition-all duration-300',
        sizeConfig[displaySize],
        shapeConfig[displayShape],
        isInteractive && 'cursor-pointer hover:opacity-80 hover:scale-[1.02] active:scale-95',
        disabled && 'opacity-50 cursor-not-allowed',
        uppercase && 'uppercase tracking-wide',
        noWrap && 'whitespace-nowrap',
        displayVariant === 'ghost' && 'hover:bg-black/5',
        isAnimated && 'animate-pulse-subtle shadow-[0_0_8px_rgba(0,0,0,0.1)]',
        className
      )}
      style={styles}
      onClick={isInteractive ? onClick : undefined}
      onKeyDown={(e) => {
        if (isInteractive && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onClick?.();
        }
      }}
      role={isInteractive ? 'button' : undefined}
      tabIndex={isInteractive ? 0 : undefined}
      title={title || displayName}
    >
      {showDot && !iconName && (
        <span
          className="w-1.5 h-1.5 rounded-full shrink-0"
          style={{ backgroundColor: displayColor }}
        />
      )}
      {iconName && (
        <LucideIconRenderer 
          name={iconName}
          size={iconSizeConfig[displaySize]} 
          className="shrink-0" 
          strokeWidth={2.5}
        />
      )}
      {showLabel && <span>{displayName}</span>}
      {children}
    </span>
  );

  if (allowStyleEdit && id !== 'preview' && id !== 'more') {
    return (
      <BadgeStylePicker id={id} type={type}>
        {content}
      </BadgeStylePicker>
    );
  }

  return content;
}

// ============================================================
// QUICK STYLE PICKER (на лету)
// ============================================================

/**
 * Пресеты для быстрой смены стиля бейджа
 */
const BADGE_PRESETS = [
  { id: 'ocean_glass', color: '#3b82f6', variant: 'soft', isGlass: true, shape: 'pill', isGradient: false, isAnimated: false },
  { id: 'emerald_solid', color: '#10b981', variant: 'solid', shape: 'rounded', isGlass: false, isGradient: false, isAnimated: false },
  { id: 'ruby_outline', color: '#ef4444', variant: 'outline', shape: 'stadium', isGlass: false, isGradient: false, isAnimated: false },
  { id: 'amber_glow', color: '#f59e0b', variant: 'soft', isAnimated: true, shape: 'bubble', isGlass: false, isGradient: false },
  { id: 'amethyst_grad', color: '#8b5cf6', variant: 'solid', isGradient: true, secondaryColor: '#d946ef', shape: 'rounded', isGlass: false, isAnimated: false },
  { id: 'slate_ghost', color: '#64748b', variant: 'ghost', shape: 'square', isGlass: false, isGradient: false, isAnimated: false },
  { id: 'rose_pulse', color: '#f43f5e', variant: 'soft', isAnimated: true, shape: 'pill', isGlass: false, isGradient: false },
  { id: 'cyan_stadium', color: '#06b6d4', variant: 'outline', shape: 'stadium', isGlass: false, isGradient: false, isAnimated: false },
  { id: 'indigo_deep', color: '#6366f1', variant: 'solid', isGradient: true, isGlass: true, secondaryColor: '#4338ca', shape: 'rounded', isAnimated: false },
  { id: 'sunset_soft', color: '#f97316', variant: 'soft', isGradient: true, secondaryColor: '#fbbf24', shape: 'pill', isGlass: false, isAnimated: false },
] as const;

function BadgeStylePicker({ id, type, children }: { id: string; type: BadgeType; children: React.ReactNode }) {
  const { t } = useTranslation();
  const updateStatus = useUpdateStatus();
  const updateTag = useUpdateTag();
  const updatePriority = useUpdatePriority();
  const updateOutcome = useUpdateOutcome();

  const handleSelectPreset = (preset: typeof BADGE_PRESETS[number]) => {
    const secondaryColor = 'secondaryColor' in preset
      ? (preset as typeof preset & { secondaryColor?: string }).secondaryColor
      : undefined;
    const updateData = {
      id,
      color: preset.color,
      variant: preset.variant as BadgeVariantType,
      shape: preset.shape as BadgeShapeType,
      isGlass: preset.isGlass,
      isGradient: preset.isGradient,
      secondaryColor: secondaryColor ?? preset.color,
      isAnimated: preset.isAnimated,
    };

    switch (type) {
      case 'status': updateStatus.mutate(updateData as StatusUpdateRequest); break;
      case 'tag': updateTag.mutate(updateData as TagUpdateRequest); break;
      case 'priority': updatePriority.mutate(updateData as PriorityUpdateRequest); break;
      case 'outcome': updateOutcome.mutate(updateData as OutcomeUpdateRequest); break;
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <div className="relative group cursor-pointer">
          {children}
          <div className="absolute -top-1.5 -right-1.5 opacity-0 group-hover:opacity-100 transition-opacity bg-background rounded-full p-0.5 shadow-sm border border-border">
            <Palette className="w-3 h-3 text-muted-foreground" />
          </div>
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-3" align="start">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold flex items-center gap-2">
              <Palette className="w-4 h-4 text-primary" />
              {t('settings.badge_editor.quick_style')}
            </h4>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {BADGE_PRESETS.map((preset) => (
              <button
                key={preset.id}
                onClick={() => handleSelectPreset(preset)}
                className="flex items-center justify-center p-1 border rounded-md hover:bg-accent transition-colors h-10"
              >
                <Badge
                  id="preview"
                  name={t('settings.badge_editor.variant_preview')}
                  color={preset.color}
                  variant={preset.variant as BadgeVariantType}
                  shape={preset.shape as BadgeShapeType}
                  isGlass={preset.isGlass}
                  isGradient={preset.isGradient}
                  secondaryColor={'secondaryColor' in preset ? (preset as typeof preset & { secondaryColor?: string }).secondaryColor : undefined}
                  isAnimated={preset.isAnimated}
                  size="xs"
                />
              </button>
            ))}
          </div>
          <p className="text-[10px] text-muted-foreground text-center">
            {t('settings.badge_editor.quick_style_hint')}
          </p>
        </div>
      </PopoverContent>
    </Popover>
  );
}

// ============================================================
// КОМПАКТНЫЕ ОБЁРТКИ (для удобства и обратной совместимости)
// ============================================================

export function StatusBadge(props: Omit<BadgeProps, 'type'>) {
  return <Badge {...props} type="status" />;
}

export function PriorityBadge(props: Omit<BadgeProps, 'type'>) {
  return <Badge {...props} type="priority" />;
}

export function TagBadge(props: Omit<BadgeProps, 'type'>) {
  return <Badge {...props} type="tag" />;
}

export function OutcomeBadge(props: Omit<BadgeProps, 'type'>) {
  return <Badge {...props} type="outcome" />;
}

// ============================================================
// КОМПОНЕНТ ДЛЯ СПИСКА ТЕГОВ
// ============================================================

export interface TagListProps {
  tags: Array<{ id: string; name?: string; color?: string }>;
  onRemove?: (id: string) => void;
  maxVisible?: number;
  /** compatibility: module name (to disambiguate ids) */
  module?: string;
  /** compatibility alias for maxVisible */
  limit?: number;
  size?: BadgeSize;
  variant?: BadgeVariant;
  shape?: BadgeShape;
}

export function TagList({
  tags,
  onRemove,
  maxVisible = 5,
  limit,
  size = 'sm',
  variant = 'soft',
  shape = 'pill',
}: TagListProps) {
  const effectiveMax = typeof limit === 'number' ? limit : maxVisible;
  const visible = tags.slice(0, effectiveMax);
  const hidden = tags.length - effectiveMax;

  return (
    <div className="flex flex-wrap gap-1.5">
      {visible.map((tag, index) => {
        if (!tag) return null;
        const tagObj = typeof tag === 'string' ? { id: tag, name: tag } : tag;
        return (
          <Badge
            key={tagObj.id || index}
            id={tagObj.id}
            type="tag"
            name={tagObj.name}
            color={tagObj.color}
            size={size}
            variant={variant}
            shape={shape}
            {...(onRemove && {
              onClick: () => onRemove(tagObj.id),
            })}
          />
        );
      })}
      {hidden > 0 && (
        <Badge
          id="more"
          name={`+${hidden}`}
          color="#6b7280"
          size={size}
          variant="soft"
          shape={shape}
        />
      )}
    </div>
  );
}