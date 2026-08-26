import React from 'react';
import { Workflow, WorkflowStep, RegistryAction } from '../api/workflowAPI';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Play, 
  Settings, 
  Trash2, 
  GripVertical, 
  ArrowRight, 
  Box,
  AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n';

interface StepListViewProps {
  workflowData: Partial<Workflow>;
  onUpdateWorkflow: (patch: Partial<Workflow>) => void;
  onUpdateStep: (id: string, patch: Partial<WorkflowStep>) => void;
  onRemoveStep: (id: string) => void;
  onSelectStep: (id: string) => void;
  selectedStepId: string | null;
  registryActions: RegistryAction[];
}

export const StepListView: React.FC<StepListViewProps> = ({
  workflowData,
  onUpdateWorkflow,
  onUpdateStep,
  onRemoveStep,
  onSelectStep,
  selectedStepId,
  registryActions
}) => {
  const { t } = useTranslation();
  const steps = workflowData.steps || [];

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6 overflow-y-auto h-full">
      {/* Trigger Block */}
      <div className="relative">
        <div className="absolute left-[39px] top-full h-6 w-0.5 bg-slate-200 dark:bg-zinc-800" />
        <Card 
          className={cn(
            "border-2 transition-all cursor-pointer hover:border-blue-400/50",
            selectedStepId === 'trigger' ? "border-blue-500 ring-2 ring-blue-500/10 shadow-md" : "border-slate-200 dark:border-zinc-800"
          )}
          onClick={() => onSelectStep('trigger')}
        >
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
              <Play className="w-6 h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                 <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 rounded">
                  {t('workflows.table.trigger')}
                </span>
                <span className="text-[10px] font-mono text-muted-foreground uppercase">
                  {workflowData.trigger_type}
                </span>
              </div>
              <h3 className="font-bold text-base truncate">{workflowData.name || t('workflows.editor.title_new')}</h3>
              {workflowData.description && (
                <p className="text-xs text-muted-foreground truncate">{workflowData.description}</p>
              )}
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
              <Settings className="w-4 h-4" />
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Steps List */}
      <div className="space-y-6">
        {steps.length === 0 ? (
          <div className="py-12 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center text-muted-foreground bg-slate-50/50 dark:bg-zinc-900/50">
            <Box className="w-10 h-10 mb-3 opacity-20" />
            <p className="text-sm">{t('workflows.editor.no_steps_description')}</p>
          </div>
        ) : (
          steps.map((step: any, index) => {
            const actionDef = registryActions.find(a => a.module === step.module && a.name === step.action);
            const isLast = index === steps.length - 1;
            const isSelected = selectedStepId === step.id;

            return (
              <div key={step.id || index} className="relative">
                {!isLast && (
                   <div className="absolute left-[39px] top-full h-6 w-0.5 bg-slate-200 dark:bg-zinc-800" />
                )}
                
                <Card 
                  className={cn(
                    "border-2 transition-all cursor-pointer hover:border-primary/50 group",
                    isSelected ? "border-primary ring-2 ring-primary/10 shadow-md" : "border-slate-200 dark:border-zinc-800"
                  )}
                  onClick={() => onSelectStep(step.id)}
                >
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-zinc-800 flex items-center justify-center text-slate-600 dark:text-slate-400 shrink-0 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                      <GripVertical className="w-5 h-5 opacity-40 group-hover:opacity-100" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground bg-slate-100 dark:bg-zinc-800 px-2 py-0.5 rounded">
                          {t('workflows.editor.step_label')} {index + 1}
                        </span>
                        {step.module && (
                          <span className="text-[10px] font-mono text-primary uppercase">
                            {step.module}
                          </span>
                        )}
                      </div>
                      
                      <h3 className="font-bold text-base truncate">
                        {actionDef?.label || step.action || t('workflows.editor.new_step')}
                      </h3>
                      
                      {step.condition && step.condition.field && (
                        <div className="flex items-center gap-1.5 mt-1 text-[10px] text-amber-600 dark:text-amber-400 font-medium">
                          <AlertCircle className="w-3 h-3" />
                          IF {step.condition.field} {step.condition.operator}...
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                        onClick={(e) => {
                          e.stopPropagation();
                          onRemoveStep(step.id);
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                        <Settings className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            );
          })
        )}
      </div>

      <div className="flex justify-center pt-4">
        <div className="h-8 w-0.5 bg-slate-200 dark:bg-zinc-800 mb-4" />
      </div>
    </div>
  );
};
