import React from 'react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Braces, Zap, Layers } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import { WorkflowStep, RegistryAction } from '../api/workflowAPI';

interface VariablePickerProps {
  onSelect: (variable: string) => void;
  steps: WorkflowStep[];
  currentIndex: number;
  availableActions: RegistryAction[];
}

export const VariablePicker: React.FC<VariablePickerProps> = ({
  onSelect,
  steps,
  currentIndex,
  availableActions
}) => {
  const { t } = useTranslation();

  // Generate list of available variables up to current index
  const availableVariables = [
    {
      group: t('workflows.variable_picker.trigger'),
      icon: <Zap className="w-3 h-3 text-amber-500" />,
      items: [
        { label: t('workflows.variable_picker.body'), value: '{{trigger.body}}' },
        { label: t('workflows.variable_picker.account_id'), value: '{{trigger.accountId}}' },
      ]
    }
  ];

  // Add outputs from previous steps
  for (let i = 0; i < currentIndex; i++) {
    const prevStep = steps[i];
    const actionDef = availableActions.find(a => a.module === prevStep.module && a.name === prevStep.action);
    
    // Add base object
    const items = [
      { label: t('workflows.variable_picker.full_output'), value: `{{step${i + 1}}}` }
    ];

    // Add specific properties if available in outputSchema
    if (actionDef?.outputSchema?.properties) {
      Object.entries(actionDef.outputSchema.properties).forEach(([key, schema]) => {
        items.push({
          label: schema.label || key,
          value: `{{step${i + 1}.${key}}}`
        });
      });
    }

    availableVariables.push({
      group: `${t('workflows.variable_picker.step')} ${i + 1}: ${actionDef?.label || prevStep.action}`,
      icon: <Layers className="w-3 h-3 text-blue-500" />,
      items
    });
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button 
          variant="outline" 
          size="icon" 
          className="h-8 w-8 hover:text-primary transition-colors"
          title={t('workflows.editor.insert_variable')}
        >
          <Braces className="w-4 h-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-0 shadow-lg" align="end">
        <div className="p-2 border-b bg-slate-50 dark:bg-zinc-900">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <Zap className="w-3 h-3" />
            {t('workflows.editor.available_vars')}
          </p>
        </div>
        <ScrollArea className="h-64">
          <div className="p-1">
            {availableVariables.map((group, gIdx) => (
              <div key={gIdx} className="mb-2">
                <p className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase">
                  {group.group}
                </p>
                {group.items.map((item, iIdx) => (
                  <button
                    key={iIdx}
                    onClick={() => onSelect(item.value)}
                    className="w-full flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-slate-100 dark:hover:bg-zinc-800 rounded transition-colors text-left"
                  >
                    {group.icon}
                    <span className="truncate">{item.label}</span>
                    <code className="ml-auto text-[10px] bg-slate-100 dark:bg-zinc-700 px-1 rounded text-slate-500">
                      {item.value}
                    </code>
                  </button>
                ))}
              </div>
            ))}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};
