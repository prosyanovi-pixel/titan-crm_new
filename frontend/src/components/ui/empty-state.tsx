import React from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './button';

interface EmptyStateProps {
  /** Иконка для пустого состояния */
  icon?: LucideIcon | React.ReactNode;
  /** Заголовок */
  title: string;
  /** Описание */
  description?: string;
  /** Кнопка действия (опционально) */
  action?: React.ReactNode;
  /** Дополнительные классы */
  className?: string;
  /** Минимальная высота контейнера */
  minHeight?: string;
}

/**
 * Компонент пустого состояния для отображения когда данные отсутствуют
 * 
 * @example
 * ```tsx
 * <EmptyState
 *   icon={<Folder className="w-12 h-12 text-muted-foreground" />}
 *   title="Нет этапов"
 *   description="Этапы не добавлены. Добавьте первый этап, чтобы начать планирование."
 *   action={
 *     <Button onClick={handleAdd}>
 *       <Plus className="w-4 h-4" />
 *       Добавить этап
 *     </Button>
 *   }
 * />
 * ```
 */
export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
  minHeight = 'h-48',
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center p-12 border rounded-xl bg-card shadow-sm',
        minHeight,
        className
      )}
    >
      {icon && (
        <div className="mb-6 relative flex items-center justify-center">
          <div className="absolute inset-0 bg-primary/5 blur-2xl rounded-full scale-150"></div>
          <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-primary/10 text-primary ring-8 ring-primary/5">
            {typeof icon === 'function' ? (
              React.createElement(icon as React.ComponentType<{ className?: string }>, { className: 'w-12 h-12' })
            ) : (
              icon
            )}
          </div>
        </div>
      )}
      
      <h3 className="text-lg font-semibold text-foreground mb-1">
        {title}
      </h3>
      
      {description && (
        <p className="text-sm text-muted-foreground mb-4 max-w-md">
          {description}
        </p>
      )}
      
      {action && (
        <div className="flex gap-2">
          {action}
        </div>
      )}
    </div>
  );
}
