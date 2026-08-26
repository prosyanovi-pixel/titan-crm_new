import React, { useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { RegistryAction, WorkflowStep, Workflow, StepCondition } from '../../api/workflowAPI';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { X, Save, Trash2, GitBranch } from 'lucide-react';
import { VariablePicker } from '../VariablePicker';
import { ConditionEditor } from '../ConditionEditor';
import { useTranslation } from '@/lib/i18n';
import { useSheetWidth } from '@/hooks/useSheetWidth';

interface NodeConfigPanelProps {
  selectedNodeId: string | null;
  workflowData: Partial<Workflow>;
  steps: WorkflowStep[];
  registryActions: RegistryAction[];
  onClose: () => void;
  onUpdateWorkflow: (patch: Partial<Workflow>) => void;
  onUpdateStep: (id: string, patch: Partial<WorkflowStep>) => void;
  onRemoveStep: (id: string) => void;
}

export const NodeConfigPanel: React.FC<NodeConfigPanelProps> = ({
  selectedNodeId,
  workflowData,
  steps,
  registryActions,
  onClose,
  onUpdateWorkflow,
  onUpdateStep,
  onRemoveStep
}) => {
  const { t } = useTranslation();
  
  const { data: mailAccounts = [] } = useQuery<any[]>({
    queryKey: ['mail-accounts'],
    queryFn: () => api.get('/mail/accounts'),
  });

  const { width: sheetWidth, setCustomWidth: setSheetCustomWidth, getWidthValue } = useSheetWidth('workflow-node-config', 'md');
  const panelRef = useRef<HTMLDivElement>(null);
  const startXRef = useRef(0);
  const startWidthRef = useRef(0);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    startXRef.current = e.clientX;
    startWidthRef.current = panelRef.current?.offsetWidth || sheetWidth.customWidth || getWidthValue();

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = startXRef.current - moveEvent.clientX;
      const newWidth = Math.max(320, Math.min(startWidthRef.current + deltaX, window.innerWidth * 0.8));
      setSheetCustomWidth(newWidth);
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  };

  if (!selectedNodeId) return null;

  const isTrigger = selectedNodeId === 'trigger';
  const selectedStep = isTrigger ? null : steps.find(s => s.id === selectedNodeId);
  const stepIndex = isTrigger ? -1 : steps.findIndex(s => s.id === selectedNodeId);

  if (!isTrigger && !selectedStep) return null;

  const renderTriggerConfig = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>{t('workflows.editor.field.name')}</Label>
        <Input
          placeholder={t('workflows.editor.placeholder.name')}
          value={workflowData.name || ''}
          onChange={e => onUpdateWorkflow({ name: e.target.value })}
        />
      </div>

      <div className="space-y-2">
        <Label>{t('workflows.editor.field.description')}</Label>
        <Textarea
          placeholder={t('workflows.editor.placeholder.description')}
          value={workflowData.description || ''}
          onChange={e => onUpdateWorkflow({ description: e.target.value })}
        />
      </div>

      <div className="space-y-2">
        <Label>{t('workflows.editor.field.trigger_type')}</Label>
        <Select
          value={workflowData.trigger_type}
          onValueChange={(val: any) => onUpdateWorkflow({ trigger_type: val })}
        >
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="webhook">{t('workflows.editor.trigger_options.webhook')}</SelectItem>
            <SelectItem value="schedule">{t('workflows.editor.trigger_options.schedule')}</SelectItem>
            <SelectItem value="event">{t('workflows.editor.trigger_options.event')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>{t('workflows.editor.field.status')}</Label>
        <Select
          value={workflowData.status}
          onValueChange={(val: any) => onUpdateWorkflow({ status: val })}
        >
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="draft">{t('workflows.editor.status_options.draft')}</SelectItem>
            <SelectItem value="active">{t('workflows.editor.status_options.active')}</SelectItem>
            <SelectItem value="paused">{t('workflows.editor.status_options.paused')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {workflowData.trigger_type === 'schedule' && (
        <div className="space-y-2">
          <Label>{t('workflows.editor.field.cron')}</Label>
          <Input
            placeholder={t('workflows.editor.placeholder.cron')}
            value={workflowData.trigger_config?.cron || ''}
            onChange={e => onUpdateWorkflow({ 
              trigger_config: { ...workflowData.trigger_config, cron: e.target.value } 
            })}
          />
        </div>
      )}

      {workflowData.trigger_type === 'event' && (
        <div className="space-y-2">
          <Label>{t('workflows.editor.field.event_name')}</Label>
          <Input
            placeholder="например, projects.status_changed"
            value={workflowData.trigger_config?.eventName || ''}
            onChange={e => onUpdateWorkflow({ 
              trigger_config: { ...workflowData.trigger_config, eventName: e.target.value } 
            })}
          />
        </div>
      )}
    </div>
  );

  const renderActionConfig = () => {
    if (!selectedStep) return null;

    const modules = Array.from(new Set(registryActions.map(a => a.module)));
    const currentModuleActions = registryActions.filter(a => a.module === selectedStep.module);
    const currentActionDef = currentModuleActions.find(a => a.name === selectedStep.action);
    const config = selectedStep.action_config || {};

    const toggleCondition = (enabled: boolean) => {
      if (enabled) {
        onUpdateStep(selectedNodeId, { 
          condition: { type: 'rule', field: '', operator: 'exists', value: '' } 
        } as any);
      } else {
        onUpdateStep(selectedNodeId, { condition: null } as any);
      }
    };

    return (
      <div className="space-y-4">
        <div className="space-y-2">
          <Label>{t('workflows.editor.field.module')}</Label>
          <Select
            value={selectedStep.module}
            onValueChange={(val) => onUpdateStep(selectedNodeId, { module: val, action: '', action_config: {} })}
          >
            <SelectTrigger><SelectValue placeholder={t('workflows.editor.placeholder.module')} /></SelectTrigger>
            <SelectContent>
              {modules.map(m => <SelectItem key={m} value={m}>{m.toUpperCase()}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>{t('workflows.editor.field.action')}</Label>
          <Select
            value={selectedStep.action}
            onValueChange={(val) => onUpdateStep(selectedNodeId, { action: val, action_config: {} })}
            disabled={!selectedStep.module}
          >
            <SelectTrigger><SelectValue placeholder={t('workflows.editor.placeholder.action')} /></SelectTrigger>
            <SelectContent>
              {currentModuleActions.map(a => <SelectItem key={a.name} value={a.name}>{a.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {currentActionDef?.inputSchema?.properties && (
          <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded-lg border space-y-3">
            <Label className="text-xs font-semibold text-muted-foreground uppercase">{t('workflows.editor.config_section')}</Label>
            {Object.entries(currentActionDef.inputSchema.properties).map(([key, schema]: [string, any]) => (
              <div key={key} className="space-y-1">
                <Label className="text-xs">{schema.label || key}</Label>
                {schema.type === 'account' ? (
                  <Select
                    value={config[key] || ''}
                    onValueChange={(val) => onUpdateStep(selectedNodeId, {
                      action_config: { ...config, [key]: val }
                    })}
                  >
                    <SelectTrigger className="text-sm"><SelectValue placeholder={t('workflows.editor.placeholder.select_account')} /></SelectTrigger>
                    <SelectContent>
                      {mailAccounts.map((acc: any) => (
                        <SelectItem key={acc.id} value={acc.id}>{acc.email}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : schema.type === 'boolean' ? (
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={!!config[key]}
                      onCheckedChange={(checked) => onUpdateStep(selectedNodeId, {
                        action_config: { ...config, [key]: checked }
                      })}
                    />
                  </div>
                ) : (
                  <div className="flex gap-1">
                    <Input
                      value={config[key] ?? (schema.default !== undefined ? schema.default : '')}
                      onChange={(e) => onUpdateStep(selectedNodeId, {
                        action_config: { ...config, [key]: e.target.value }
                      })}
                      className="text-sm font-mono"
                    />
                    <VariablePicker
                      currentIndex={stepIndex}
                      steps={steps}
                      availableActions={registryActions}
                      onSelect={(variable) => {
                        const currentVal = config[key] ?? '';
                        onUpdateStep(selectedNodeId, {
                          action_config: { ...config, [key]: currentVal + variable }
                        });
                      }}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="border rounded-lg p-3 space-y-3 bg-amber-50/50 dark:bg-amber-900/10 border-amber-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <GitBranch className="w-4 h-4 text-amber-600" />
              <Label className="text-sm font-medium text-amber-800">{t('workflows.editor.field.condition')}</Label>
            </div>
            <Switch checked={!!selectedStep.condition?.field} onCheckedChange={toggleCondition} />
          </div>
          {!!selectedStep.condition?.field && selectedStep.condition && (
            <ConditionEditor
              condition={selectedStep.condition}
              onChange={(updated) => onUpdateStep(selectedNodeId, { condition: updated } as any)}
              index={stepIndex}
              allSteps={steps}
              availableActions={registryActions}
            />
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs">{t('workflows.editor.field.delay')}</Label>
            <Input
              type="number"
              min="0"
              value={selectedStep.delay_seconds || 0}
              onChange={(e) => onUpdateStep(selectedNodeId, { delay_seconds: parseInt(e.target.value) || 0 })}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">{t('workflows.editor.field.on_fail')}</Label>
            <Select
              value={selectedStep.on_fail || 'skip'}
              onValueChange={(val: any) => onUpdateStep(selectedNodeId, { on_fail: val })}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="stop">{t('workflows.editor.on_fail.stop')}</SelectItem>
                <SelectItem value="skip">{t('workflows.editor.on_fail.skip')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button 
          variant="destructive" 
          className="w-full mt-6"
          onClick={() => onRemoveStep(selectedNodeId)}
        >
          <Trash2 className="w-4 h-4 mr-2" />
          {t('workflows.editor.remove_step')}
        </Button>
      </div>
    );
  };

  return (
    <div 
      ref={panelRef}
      className="border-l bg-card flex flex-col h-full shadow-xl relative flex-shrink-0"
      style={{ width: sheetWidth.customWidth ? `${sheetWidth.customWidth}px` : '320px' }}
    >
      <div
        className="absolute left-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-primary/50 transition-colors z-10"
        onMouseDown={handleMouseDown}
      />
      <div className="p-4 border-b flex items-center justify-between bg-slate-50 dark:bg-zinc-900">
        <h2 className="font-semibold">{isTrigger ? t('workflows.editor.trigger_settings') : t('workflows.editor.step_settings')}</h2>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>
      <ScrollArea className="flex-1 p-4">
        {isTrigger ? renderTriggerConfig() : renderActionConfig()}
      </ScrollArea>
    </div>
  );
};

