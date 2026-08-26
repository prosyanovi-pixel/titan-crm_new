import React from 'react';
import { LucideIcon, SearchX } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface EmptyStateProps {
  icon?: LucideIcon;
  imageUrl?: string;
  darkImageUrl?: string;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export function EmptyState({
  icon: Icon = SearchX,
  imageUrl,
  darkImageUrl,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex min-h-[400px] flex-col items-center justify-center rounded-xl border bg-card p-12 text-center shadow-sm',
        className
      )}
    >
      <div className="mx-auto mb-6 relative flex items-center justify-center">
        <div className="absolute inset-0 bg-primary/5 dark:bg-primary/10 blur-3xl rounded-full scale-150"></div>
        
        {imageUrl ? (
          <div className="relative flex items-center justify-center">
            <img src={imageUrl} alt={title} className={cn("w-48 h-48 object-contain drop-shadow-sm", darkImageUrl && "dark:hidden")} />
            {darkImageUrl && (
              <img src={darkImageUrl} alt={title} className="w-48 h-48 object-contain drop-shadow-sm hidden dark:block" />
            )}
          </div>
        ) : (
          <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-primary/10 dark:bg-primary/20 text-primary ring-8 ring-primary/5 dark:ring-primary/10">
            <Icon className="h-12 w-12" />
          </div>
        )}
      </div>
      <h3 className="mt-4 text-lg font-semibold">{title}</h3>
      {description && (
        <p className="mt-2 mb-4 max-w-sm text-sm text-muted-foreground">
          {description}
        </p>
      )}
      {action && (
        <Button onClick={action.onClick} variant="outline" className="mt-4">
          {action.label}
        </Button>
      )}
    </div>
  );
}
