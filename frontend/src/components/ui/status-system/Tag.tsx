/**
 * Tag — компонент для отображения тега с динамическим цветом
 * 
 * Цвет тега загружается из базы данных через хуки.
 * Если тег не найден в БД, цвет генерируется из названия.
 * 
 * @example
 * ```tsx
 * // Простое использование
 * <Tag tagId="vip" />
 * 
 * // С кастомным названием
 * <Tag tagId="vip" name="VIP Клиент" />
 * 
 * // Удаляемый тег
 * <Tag tagId="vip" onRemove={() => handleRemove('vip')} />
 * 
 * // Интерактивный тег
 * <Tag tagId="vip" onClick={() => handleTagClick('vip')} />
 * ```
 */

import React from 'react';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';
import { useTags } from './status-system.hooks';
import { generateColorFromString } from '@/lib/color';
import { useTranslation } from '@/lib/i18n';

export interface TagProps {
  /** ID тега в БД */
  tagId?: string;
  /** Название тега (если tagId не указан, используется как ключ для генерации цвета) */
  name?: string;
  /** Кастомный цвет (переопределяет цвет из БД) */
  color?: string;
  /** Дополнительный CSS класс */
  className?: string;
  /** Размер тега */
  size?: 'sm' | 'md' | 'lg';
  /** Вариант отображения */
  variant?: 'solid' | 'outline' | 'soft';
  /** Скругление */
  rounded?: 'none' | 'sm' | 'md' | 'full';
  /** Показывать ли кнопку удаления */
  onRemove?: () => void;
  /** Обработчик клика */
  onClick?: () => void;
  /** Отключён ли тег */
  disabled?: boolean;
  /** Tooltip текст */
  title?: string;
  /** Иконка слева */
  icon?: React.ReactNode;
  /** Категория тега (для группировки) */
  category?: string;
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
 * Компонент Tag с автоматической загрузкой цвета из БД
 */
export function Tag({
  tagId,
  name,
  color,
  className,
  size,
  variant,
  rounded,
  onRemove,
  onClick,
  disabled = false,
  title,
  icon,
  category,
}: TagProps) {
  // Маппинг legacy-скругления в новую систему форм
  const shapeMap: Record<string, BadgeShape> = {
    none: 'square',
    sm: 'rounded',
    md: 'rounded',
    full: 'pill',
  };

  return (
    <Badge
      id={tagId || name || ''}
      type="tag"
      color={color}
      name={name}
      size={size as BadgeSize}
      variant={variant as BadgeVariant}
      shape={rounded ? shapeMap[rounded] : undefined}
      onClick={onClick}
      disabled={disabled}
      className={cn(className, onRemove && 'pr-1')}
      title={title}
      showLabel={true} // Теги обычно всегда показывают название
    >
      {category && (
        <span className="text-xs opacity-60 ml-1">({category})</span>
      )}
      {onRemove && !disabled && (
        <button
          type="button"
          className="shrink-0 p-0.5 hover:bg-black/10 rounded-full transition-colors ml-1"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          aria-label={`Удалить тег`}
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </Badge>
  );
}

/**
 * TagList — контейнер для списка тегов
 */
export interface TagListProps {
  tags: Array<{ id?: string; name: string; color?: string }>;
  className?: string;
  onRemoveTag?: (tagId: string) => void;
  onTagClick?: (tagId: string) => void;
  maxVisible?: number;
  /** compatibility: module name (to disambiguate ids) */
  module?: string;
}

export function TagList({
  tags,
  className,
  onRemoveTag,
  onTagClick,
  maxVisible = 5,
}: TagListProps) {
  const visibleTags = tags.slice(0, maxVisible);
  const hiddenCount = tags.length - maxVisible;

  return (
    <div className={cn('flex flex-wrap gap-1.5', className)}>
      {visibleTags.map((tag, index) => {
        if (!tag) return null;
        const tagObj = typeof tag === 'string' ? { id: tag, name: tag } : tag;
        return (
          <Tag
            key={tagObj.id || tagObj.name || index}
            tagId={tagObj.id}
            name={tagObj.name}
            color={tagObj.color}
            onRemove={onRemoveTag ? () => onRemoveTag(tagObj.id || tagObj.name) : undefined}
            onClick={onTagClick ? () => onTagClick(tagObj.id || tagObj.name) : undefined}
            size="sm"
          />
        );
      })}
      {hiddenCount > 0 && (
        <span className="px-2 py-0.5 text-xs bg-muted text-muted-foreground rounded-full">
          +{hiddenCount}
        </span>
      )}
    </div>
  );
}

/**
 * TagInput — поле ввода для добавления тегов
 */
export interface TagInputProps {
  value: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function TagInput({
  value,
  onChange,
  placeholder = 'Добавьте тег...',
  className,
  disabled = false,
  module,
}: TagInputProps & { module?: string }) {
  const { t } = useTranslation();
  const [input, setInput] = React.useState('');
  const [isOpen, setIsOpen] = React.useState(false);
  const { tags: existingTags } = useTags({ module });

  const filteredSuggestions = React.useMemo(() => {
    if (!input.trim()) return existingTags.filter(t => !value.includes(t.id) && !value.includes(t.name));
    const q = input.toLowerCase();
    return existingTags.filter(t => 
      (t.name.toLowerCase().includes(q) || t.id.toLowerCase().includes(q)) && 
      !value.includes(t.id) && !value.includes(t.name)
    );
  }, [existingTags, input, value]);

  const addTag = (tag: string) => {
    if (!value.includes(tag)) {
      onChange([...value, tag]);
    }
    setInput('');
    setIsOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && input.trim()) {
      e.preventDefault();
      addTag(input.trim());
    } else if (e.key === 'Backspace' && !input && value.length > 0) {
      onChange(value.slice(0, -1));
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  return (
    <div className="relative">
      <div 
        className={cn(
          'flex flex-wrap gap-1.5 p-2 border rounded-md bg-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2', 
          className,
          disabled && 'opacity-50 cursor-not-allowed'
        )}
      >
        {value.map((tagId) => (
          <Tag
            key={tagId}
            tagId={tagId}
            onRemove={() => onChange(value.filter((t) => t !== tagId))}
            size="sm"
          />
        ))}
        <input
          type="text"
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={value.length === 0 ? placeholder : ''}
          disabled={disabled}
          className="flex-1 min-w-[120px] outline-none text-sm bg-transparent"
        />
      </div>

      {isOpen && filteredSuggestions.length > 0 && (
        <div className="absolute z-[100] w-full mt-1 bg-popover text-popover-foreground border rounded-md shadow-md max-h-[200px] overflow-y-auto">
          <div className="p-1">
            {filteredSuggestions.map((tag) => (
              <button
                key={tag.id}
                type="button"
                className="flex items-center justify-between w-full px-2 py-1.5 text-sm rounded-sm hover:bg-accent hover:text-accent-foreground text-left"
                onClick={() => addTag(tag.id)}
              >
                <div className="flex items-center gap-2">
                  <div 
                    className="w-2 h-2 rounded-full" 
                    style={{ backgroundColor: tag.color }} 
                  />
                  <span>{tag.name}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
      
      {isOpen && input.trim() && !filteredSuggestions.some(t => t.name.toLowerCase() === input.toLowerCase()) && (
        <div className="absolute z-[100] w-full mt-1 bg-popover text-popover-foreground border rounded-md shadow-md">
          <div className="p-1">
            <button
              type="button"
              className="flex items-center gap-2 w-full px-2 py-1.5 text-sm rounded-sm hover:bg-accent hover:text-accent-foreground text-left"
              onClick={() => addTag(input.trim())}
            >
              <span className="text-muted-foreground">{t('common.add_tag')}</span>
              <span className="font-medium">"{input.trim()}"</span>
            </button>
          </div>
        </div>
      )}
      
      {isOpen && (
        <div 
          className="fixed inset-0 z-[90]" 
          onClick={() => setIsOpen(false)} 
        />
      )}
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
