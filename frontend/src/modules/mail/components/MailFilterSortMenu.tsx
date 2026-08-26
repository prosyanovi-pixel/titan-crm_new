import React from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Filter, Check, ArrowUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';

import { MailFilterType, MailSortType } from '../types';

interface MailFilterSortMenuProps {
  filter: MailFilterType;
  sort: MailSortType;
  onFilterChange: (filter: MailFilterType) => void;
  onSortChange: (sort: MailSortType) => void;
}

const filterLabels: Record<string, string> = {
  all: 'Все письма',
  unread: 'Непрочитанные',
  starred: 'С флагом',
  attachments: 'С вложениями',
};

const sortLabels: Record<string, string> = {
  'date-desc': 'Сначала новые',
  'date-asc': 'Сначала старые',
  'sender-asc': 'Автор: от А до Я',
  'sender-desc': 'Автор: от Я до А',
  'subject-asc': 'Тема: от А до Я',
  'subject-desc': 'Тема: от Я до А',
};

export function MailFilterSortMenu({
  filter,
  sort,
  onFilterChange,
  onSortChange,
}: MailFilterSortMenuProps) {
  const activeFiltersCount = filter !== 'all' ? 1 : 0;

  return (
    <div className="flex items-center gap-2 shrink-0">
      {/* MAIL-14: Меню фильтров и сортировки */}
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2 relative shrink-0">
            <Filter className="h-4 w-4" />
            Фильтр
            {/* Бейдж всегда занимает место, но невидим когда 0 */}
            <span className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center pointer-events-none">
              {activeFiltersCount > 0 && (
                <Badge
                  variant="default"
                  className="h-5 w-5 flex items-center justify-center p-0 text-xs"
                >
                  {activeFiltersCount}
                </Badge>
              )}
            </span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56">
          {/* Раздел фильтров */}
          <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase">
            Фильтр
          </div>
          {Object.entries(filterLabels).map(([key, label]) => (
            <DropdownMenuItem
              key={key}
              onClick={() => onFilterChange(key as any)}
              className={cn(
                'cursor-pointer',
                filter === key && 'bg-muted font-semibold'
              )}
            >
              {label}
              {filter === key && <Check className="ml-auto h-4 w-4" />}
            </DropdownMenuItem>
          ))}
          
          <DropdownMenuSeparator />
          
          {/* Раздел сортировки */}
          <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase">
            Сортировка
          </div>
          {Object.entries(sortLabels).map(([key, label]) => (
            <DropdownMenuItem
              key={key}
              onClick={() => onSortChange(key as any)}
              className={cn(
                'cursor-pointer',
                sort === key && 'bg-muted font-semibold'
              )}
            >
              {label}
              {sort === key && <Check className="ml-auto h-4 w-4" />}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* MAIL-15: Индикация активной сортировки */}
      <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0 min-w-[140px] justify-end">
        <ArrowUpDown className="h-3 w-3 shrink-0" />
        <span className="truncate">{sortLabels[sort]}</span>
      </div>
    </div>
  );
}
