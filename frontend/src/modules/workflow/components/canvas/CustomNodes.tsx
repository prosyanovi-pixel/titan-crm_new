import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { Play, Settings, AlertCircle, Box } from 'lucide-react';
import { cn } from '@/lib/utils';
import { WorkflowStep } from '../../api/workflowAPI';
import { useTranslation } from '@/lib/i18n';

interface TriggerNodeData {
  trigger_type: string;
  name: string;
  description: string;
  onClick: () => void;
  selected?: boolean;
}

export const TriggerNode = ({ data, selected }: { data: TriggerNodeData, selected?: boolean }) => {
  const { t } = useTranslation();
  return (
    <div 
      className={cn(
        "bg-card border-2 rounded-xl p-4 shadow-sm w-64 cursor-pointer transition-all",
        selected || data.selected ? "border-primary ring-2 ring-primary/20 shadow-md" : "border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700"
      )}
      onClick={(e) => {
        e.stopPropagation();
        data.onClick();
      }}
    >
      <div className="flex items-center gap-3 mb-2">
        <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
          <Play className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm truncate">{data.name || t('workflows.editor.title_new')}</h3>
          <p className="text-[10px] text-muted-foreground truncate uppercase tracking-wider">{t(`workflows.trigger_type.${data.trigger_type}`) || data.trigger_type}</p>
        </div>
      </div>
      {data.description && (
        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-2">
          {data.description}
        </p>
      )}
      <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-blue-500" />
    </div>
  );
};

interface ActionNodeData {
  step: WorkflowStep;
  index: number;
  actionLabel: string;
  moduleLabel: string;
  isError?: boolean;
  onClick: () => void;
  selected?: boolean;
}

export const ActionNode = ({ data, selected }: { data: ActionNodeData, selected?: boolean }) => {
  const { t } = useTranslation();
  return (
    <div 
      className={cn(
        "bg-card border-2 rounded-xl p-4 shadow-sm w-64 cursor-pointer transition-all",
        selected || data.selected ? "border-primary ring-2 ring-primary/20 shadow-md" : "border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700",
        data.isError && !selected ? "border-red-300 dark:border-red-800" : ""
      )}
      onClick={(e) => {
        e.stopPropagation();
        data.onClick();
      }}
    >
      <Handle type="target" position={Position.Top} className="w-3 h-3 bg-slate-300" />
      
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-mono bg-slate-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded text-slate-500">
          {t('workflows.editor.step_label')} {data.index + 1}
        </span>
        {data.isError && <AlertCircle className="w-4 h-4 text-red-500" />}
      </div>

      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-zinc-800 flex items-center justify-center text-slate-600 dark:text-slate-400">
          <Box className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="mb-1.5">
            <p className="text-[9px] uppercase text-muted-foreground/60 leading-none mb-1">
              {t('workflows.editor.field.action')}
            </p>
            <h3 className="font-bold text-xs truncate text-slate-900 dark:text-zinc-100">
              {data.actionLabel || data.step?.action || t('workflows.editor.placeholder.action')}
            </h3>
          </div>
          <div>
            <p className="text-[9px] uppercase text-muted-foreground/60 leading-none mb-1">
              {t('workflows.editor.field.module')}
            </p>
            <p className="text-[10px] text-muted-foreground truncate font-medium">
              {data.moduleLabel || data.step?.module || t('workflows.editor.field.module')}
            </p>
          </div>
        </div>
      </div>
      
      {data.step?.condition?.field && (
        <div className="mt-3 text-[10px] bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 px-2 py-1 rounded border border-amber-200 dark:border-amber-800">
          {t('workflows.editor.field.condition')}: {data.step.condition.field} {data.step.condition.operator}...
        </div>
      )}

      <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-slate-300" />
    </div>
  );
};
