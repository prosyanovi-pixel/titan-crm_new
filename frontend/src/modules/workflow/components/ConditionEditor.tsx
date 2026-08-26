import React from 'react';
import { Plus, Trash2, GitBranch, Terminal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from '@/lib/i18n';
import { StepCondition, WorkflowStep, RegistryAction } from '../api/workflowAPI';
import { VariablePicker } from './VariablePicker';

/**
 * Реквизиты для компонента ConditionEditor
 */
interface ConditionEditorProps {
  condition: StepCondition;
  onChange: (updated: StepCondition) => void;
  index: number;
  allSteps: WorkflowStep[];
  availableActions: RegistryAction[];
  depth?: number;
}

const OPERATOR_KEYS = [
  'exists', 'not_exists', 'equals', 'not_equals',
  'contains', 'not_contains', 'regex', 'gt', 'gte', 'lt', 'lte'
];

/**
 * Рекурсивный редактор логических условий (правила и группы AND/OR)
 */
export const ConditionEditor: React.FC<ConditionEditorProps> = ({
  condition,
  onChange,
  index,
  allSteps,
  availableActions,
  depth = 0
}) => {
  const { t } = useTranslation();

  // Ограничение вложенности для предотвращения перегрузки UI
  if (depth > 3) return <div className="text-xs text-red-500 p-2">{t('workflows.condition.max_depth')}</div>;

  /**
   * Обновление поля в правиле
   */
  const updateRule = (patch: Partial<StepCondition>) => {
    onChange({ ...condition, ...patch });
  };

  /**
   * Добавление элемента в группу
   */
  const addElement = (element: StepCondition) => {
    const currentConditions = condition.conditions || [];
    onChange({
      ...condition,
      type: 'group',
      logical_op: condition.logical_op || 'AND',
      conditions: [...currentConditions, element]
    });
  };

  /**
   * Обновление элемента в группе по индексу
   */
  const updateElement = (idx: number, updated: StepCondition) => {
    const next = [...(condition.conditions || [])];
    next[idx] = updated;
    onChange({ ...condition, conditions: next });
  };

  /**
   * Удаление элемента из группы
   */
  const removeElement = (idx: number) => {
    const next = (condition.conditions || []).filter((_, i) => i !== idx);
    // Если группа опустела, можно оставить как есть или превратить в правило
    onChange({ ...condition, conditions: next });
  };

  // Отрисовка Группы (AND/OR)
  if (condition.type === 'group') {
    return (
      <div className={`space-y-3 p-3 rounded-lg border-l-2 ${depth % 2 === 0 ? 'bg-slate-100/50 border-slate-300' : 'bg-white border-slate-200 shadow-sm'}`}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Select
              value={condition.logical_op || 'AND'}
              onValueChange={(val: 'AND' | 'OR') => onChange({ ...condition, logical_op: val })}
            >
              <SelectTrigger className="w-[80px] h-7 text-xs font-bold bg-primary text-white border-0">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="AND">{t('workflows.condition.logical_op.AND')}</SelectItem>
                <SelectItem value="OR">{t('workflows.condition.logical_op.OR')}</SelectItem>
              </SelectContent>
            </Select>
            <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">
              {t('workflows.condition.group')} ({t('workflows.condition.level')} {depth})
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="h-7 text-[10px] gap-1 px-2 border-dashed"
              onClick={() => addElement({ type: 'rule', field: '', operator: 'exists', value: '' })}
            >
              <Plus className="w-3 h-3" /> {t('workflows.editor.add_rule')}
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="h-7 text-[10px] gap-1 px-2 border-dashed"
              onClick={() => addElement({ type: 'group', logical_op: 'AND', conditions: [] })}
            >
              <Plus className="w-3 h-3" /> {t('workflows.editor.add_group')}
            </Button>
          </div>
        </div>

        <div className="space-y-3 pl-2 border-l border-slate-200">
          {(condition.conditions || []).map((sub, i) => (
            <div key={i} className="relative group/item">
              <ConditionEditor
                condition={sub}
                onChange={(updated) => updateElement(i, updated)}
                index={index}
                allSteps={allSteps}
                availableActions={availableActions}
                depth={depth + 1}
              />
              <Button
                variant="ghost"
                size="sm"
                className="absolute -right-2 -top-2 h-6 w-6 rounded-full bg-white shadow-sm border opacity-0 group-hover/item:opacity-100 transition-opacity text-red-500 hover:text-red-700 p-0"
                onClick={() => removeElement(i)}
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
          ))}
          {(condition.conditions || []).length === 0 && (
            <div className="text-[10px] text-center text-muted-foreground py-4 italic border border-dashed rounded bg-slate-50">
              {t('workflows.condition.no_rules')}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Отрисовка Правила (Одиночное условие)
  const needsValue = !['exists', 'not_exists'].includes(condition.operator || '');

  return (
    <div className="grid grid-cols-[1fr_auto_1fr] gap-2 items-end bg-card p-2 rounded border border-slate-200 shadow-sm hover:border-blue-300 transition-colors">
      <div className="space-y-1">
        <div className="flex items-center gap-1 mb-1">
          <Terminal className="w-3 h-3 text-blue-500" />
          <Label className="text-[10px] text-muted-foreground uppercase font-bold">{t('workflows.condition.field_label')}</Label>
        </div>
        <div className="flex gap-1">
          <Input
            placeholder="step1.status"
            value={condition.field || ''}
            onChange={(e) => updateRule({ field: e.target.value })}
            className="font-mono text-xs h-8 bg-slate-50/50"
          />
          <VariablePicker
            currentIndex={index}
            steps={allSteps}
            availableActions={availableActions}
            onSelect={(variable) => {
              const currentVal = condition.field || '';
              const cleanVar = variable.replace('{{', '').replace('}}', '');
              updateRule({ field: currentVal + cleanVar });
            }}
          />
        </div>
      </div>

      <div className="space-y-1">
        <Label className="text-[10px] text-muted-foreground uppercase font-bold invisible">{t('workflows.condition.operator_label')}</Label>
        <Select
          value={condition.operator || 'exists'}
          onValueChange={(val) => updateRule({ operator: val })}
        >
          <SelectTrigger className="w-[120px] h-8 text-xs bg-slate-50 border-slate-200">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {OPERATOR_KEYS.map(op => (
              <SelectItem key={op} value={op} className="text-xs">
                {t(`workflows.condition_operators.${op}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1">
        {needsValue ? (
          <>
            <Label className="text-[10px] text-muted-foreground uppercase font-bold">{t('workflows.condition.value_label')}</Label>
            <div className="flex gap-1">
              <Input
                placeholder="value"
                value={condition.value || ''}
                onChange={(e) => updateRule({ value: e.target.value })}
                className="text-xs h-8"
              />
              <VariablePicker
                currentIndex={index}
                steps={allSteps}
                availableActions={availableActions}
                onSelect={(variable) => {
                  const currentVal = condition.value || '';
                  updateRule({ value: currentVal + variable });
                }}
              />
            </div>
          </>
        ) : (
          <div className="h-8 flex items-center pl-2">
            <Badge variant="outline" className="text-[9px] text-muted-foreground border-slate-200 font-normal">
              {t('workflows.condition.value_not_required')}
            </Badge>
          </div>
        )}
      </div>
    </div>
  );
};
