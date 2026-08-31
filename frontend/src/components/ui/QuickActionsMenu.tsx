/**
 * QuickActionsMenu - универсальное выпадающее меню быстрых действий
 * Объединяет быстрые действия (из БД) и обычные действия (просмотр, редактирование, удаление)
 */
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import * as LucideIcons from 'lucide-react';
import { LucideIcon, MoreVertical } from 'lucide-react';

export interface QuickActionMenuOption {
  label: string;
  action: string;
  icon?: string | LucideIcon;
  disabled?: boolean;
  variant?: 'default' | 'destructive';
  isQuickAction?: boolean;
}

/** Преобразует QuickAction в QuickActionMenuOption */
export function toQuickActionMenuOption(action: { name: string; action: string; icon?: string | LucideIcon; isQuickAction?: boolean; disabled?: boolean; variant?: 'default' | 'destructive' }): QuickActionMenuOption {
  return {
    label: action.name,
    action: action.action,
    icon: action.icon,
    disabled: action.disabled,
    variant: action.variant,
    isQuickAction: action.isQuickAction,
  };
}

interface QuickActionsMenuProps {
  itemId: string | number;
  itemName?: string;
  options: QuickActionMenuOption[] | ({ name: string; action: string; icon?: string | LucideIcon; isQuickAction?: boolean; disabled?: boolean; variant?: 'default' | 'destructive' })[];
  onAction: (action: string, itemId: string | number) => void;
}

function ActionIcon({ icon }: { icon?: string | LucideIcon }) {
  if (!icon) return <MoreVertical className="w-4 h-4" />;
  
  // If icon is a string, look it up in LucideIcons
  if (typeof icon === 'string') {
    const Icon = (LucideIcons as any)[icon];
    if (!Icon) return <MoreVertical className="w-4 h-4" />;
    return <Icon className="w-4 h-4" />;
  }
  
  // If icon is a LucideIcon component, render it directly
  const Icon = icon as LucideIcon;
  return <Icon className="w-4 h-4" />;
}

export function QuickActionsMenu({
  itemId,
  itemName,
  options,
  onAction,
}: QuickActionsMenuProps) {
  const normalizedOptions: QuickActionMenuOption[] = (options || []).map(opt => 
    'label' in opt ? opt : toQuickActionMenuOption(opt)
  );
  
  if (!normalizedOptions || normalizedOptions.length === 0) return null;

  const quickActions = normalizedOptions.filter(o => o.isQuickAction);
  const regularActions = normalizedOptions.filter(o => !o.isQuickAction);

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" style={{ minWidth: '32px', maxWidth: '32px' }}>
          <MoreVertical className="w-4 h-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56" sideOffset={4}>
        {quickActions.map((item) => (
          <DropdownMenuItem
            key={item.action}
            onClick={() => onAction(item.action, itemId)}
            disabled={item.disabled}
            className={item.variant === 'destructive' ? 'text-destructive focus:text-destructive' : ''}
          >
            <ActionIcon icon={item.icon} />
            <span className="ml-2">{item.label}</span>
          </DropdownMenuItem>
        ))}

        {quickActions.length > 0 && regularActions.length > 0 && (
          <DropdownMenuSeparator />
        )}

        {regularActions.map((item) => (
          <DropdownMenuItem
            key={item.action}
            onClick={() => onAction(item.action, itemId)}
            disabled={item.disabled}
            className={item.variant === 'destructive' ? 'text-destructive focus:text-destructive' : ''}
          >
            <ActionIcon icon={item.icon} />
            <span className="ml-2">{item.label}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
