import React from 'react';
import { 
  Play, Pause, Pencil, Trash2, FileCode2, Clock, 
  History as HistoryIcon, Terminal, MoreHorizontal 
} from 'lucide-react';
import { TableCell, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useTranslation } from '@/lib/i18n';
import { Workflow } from '../api/workflowAPI';

const STATUS_CONFIG = {
  active:  { labelKey: 'workflows.status.active',  variant: 'default'   as const, icon: Play,     className: 'bg-green-500 hover:bg-green-600 text-white' },
  paused:  { labelKey: 'workflows.status.paused',  variant: 'secondary' as const, icon: Pause,    className: '' },
  draft:   { labelKey: 'workflows.status.draft',   variant: 'outline'   as const, icon: FileCode2, className: '' },
};

const TRIGGER_TYPE_KEYS: Record<string, string> = {
  webhook:  'workflows.trigger_type.webhook',
  schedule: 'workflows.trigger_type.schedule',
  event:    'workflows.trigger_type.event',
};

interface WorkflowTableRowProps {
  workflow: Workflow & { id: string };
  selectedIds: Set<string | number>;
  visibleColumns: Record<string, boolean>;
  columnOrder: string[];
  columnWidths?: Record<string, number>;
  onToggleSelection: (id: string) => void;
  onEdit: (id: string) => void;
  onRun: (id: string, dryRun?: boolean) => void;
  onDelete: (id: string) => void;
  onShowHistory?: (wf: Workflow & { id: string }) => void;
}

export const WorkflowTableRow: React.FC<WorkflowTableRowProps> = ({
  workflow,
  selectedIds,
  visibleColumns,
  columnOrder,
  columnWidths,
  onToggleSelection,
  onEdit,
  onRun,
  onDelete,
  onShowHistory,
}) => {
  const { t } = useTranslation();
  const isSelected = selectedIds.has(workflow.id);

  const StatusBadge = ({ status }: { status: string }) => {
    const cfg = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.draft;
    const Icon = cfg.icon;
    return (
      <Badge variant={cfg.variant} className={`gap-1 text-[10px] sm:text-xs h-5 sm:h-6 ${cfg.className}`}>
        <Icon className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
        <span className="hidden xs:inline">{t(cfg.labelKey)}</span>
      </Badge>
    );
  };

  return (
    <TableRow 
      className={`group cursor-pointer hover:bg-muted/50 ${isSelected ? 'bg-muted' : ''}`} 
      onClick={() => onEdit(workflow.id)}
    >
      <TableCell onClick={e => e.stopPropagation()} className="w-10">
        <Checkbox 
          checked={isSelected} 
          onCheckedChange={() => onToggleSelection(workflow.id)} 
        />
      </TableCell>

      {columnOrder.filter(key => visibleColumns[key]).map(key => {
        const style: React.CSSProperties = { 
          width: columnWidths?.[key] ? `${columnWidths[key]}px` : undefined,
        };
        switch (key) {
          case 'name': return (
            <TableCell key="name" style={style}>
              <div className="min-w-0">
                <p className="font-semibold text-sm truncate">{workflow.name}</p>
                {workflow.description && (
                  <p className="text-[11px] text-muted-foreground truncate opacity-70">
                    {workflow.description}
                  </p>
                )}
              </div>
            </TableCell>
          );
          case 'trigger': return (
            <TableCell key="trigger" style={style}>
              <div className="flex items-center gap-1.5 text-xs sm:text-sm text-muted-foreground whitespace-nowrap">
                <Clock className="w-3 h-3 shrink-0" />
                <span>{t(TRIGGER_TYPE_KEYS[workflow.trigger_type] || 'workflows.trigger_type.event')}</span>
              </div>
            </TableCell>
          );
          case 'status': return (
            <TableCell key="status" style={style}>
              <StatusBadge status={workflow.status} />
            </TableCell>
          );
          case 'steps': return (
            <TableCell key="steps" className="font-mono text-[10px] sm:text-xs text-muted-foreground" style={style}>
              {workflow.steps?.length ?? 0} {t('workflows.table.steps_count', { count: workflow.steps?.length ?? 0 })}
            </TableCell>
          );
          default: return null;
        }
      })}

      <TableCell className="text-right" onClick={e => e.stopPropagation()}>
        <div className="flex justify-end gap-1 items-center">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 text-muted-foreground hover:text-primary transition-colors hidden sm:flex" 
            title={t('workflows.actions.history')} 
            disabled={!onShowHistory}
            onClick={() => onShowHistory?.(workflow)}
          >
            <HistoryIcon className="w-4 h-4" />
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 shadow-lg border-primary/10">
              <DropdownMenuItem onClick={() => onEdit(workflow.id)} className="gap-2 cursor-pointer">
                <Pencil className="w-4 h-4 text-primary" /> {t('common.edit')}
              </DropdownMenuItem>
              {onShowHistory && (
                <DropdownMenuItem onClick={() => onShowHistory(workflow)} className="gap-2 cursor-pointer sm:hidden">
                  <HistoryIcon className="w-4 h-4" /> {t('workflows.actions.history')}
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={() => onRun(workflow.id)} className="gap-2 cursor-pointer">
                <Play className="w-4 h-4 text-green-500" /> {t('workflows.actions.run_now')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onRun(workflow.id, true)} className="gap-2 cursor-pointer">
                <Terminal className="w-4 h-4 text-amber-500" /> {t('workflows.actions.dry_run')}
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => onDelete(workflow.id)} 
                className="text-red-500 gap-2 focus:text-red-500 focus:bg-red-50 cursor-pointer font-medium"
              >
                <Trash2 className="w-4 h-4" /> {t('common.delete')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </TableCell>
    </TableRow>
  );
};
