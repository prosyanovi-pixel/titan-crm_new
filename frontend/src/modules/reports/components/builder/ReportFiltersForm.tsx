/**
 * Панель фильтров конструктора отчётов (Шаг 2)
 * Динамически рендерит поля по метаданным типа отчёта
 */

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { EntityCombobox } from '@/components/shared/EntityCombobox';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { ReportFilters, ReportFilterField, FilterRule } from '../../types/reports.types';
import type { DatePreset } from '../../hooks/useReportFilters';
import { Plus, Trash2 } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import { useMemo } from 'react';

type OptionLike = {
  id?: string | number | null;
  name?: string | null;
  label?: string | null;
};

const isOptionLike = (opt: unknown): opt is OptionLike => Boolean(
  opt && typeof opt === 'object' && 'id' in opt
);

interface ReportFiltersFormProps {
  filterFields:  ReportFilterField[];
  filters:       ReportFilters;
  activePreset:  DatePreset | null;
  onFilterChange: (key: keyof ReportFilters, value: unknown) => void;
  onPresetChange: (preset: DatePreset) => void;
  onReset:        () => void;
}

/** Хук загрузки справочников */
function useOptionsData(optionsKey?: string) {
  const { t } = useTranslation();
  return useQuery({
    queryKey: ['select-options', optionsKey],
    queryFn:  async () => {
      if (optionsKey === 'entities') {
        return [
          { id: 'contracts',   name: t('reports.filters_entities_contracts') },
          { id: 'projects',    name: t('reports.filters_entities_projects') },
          { id: 'tasks',       name: t('reports.filters_entities_tasks') },
          { id: 'finance',     name: t('reports.filters_entities_finance') },
          { id: 'contractors', name: t('reports.filters_entities_contractors') },
          { id: 'marketing',   name: t('reports.filters_entities_marketing') },
        ];
      }
      const endpoint = (optionsKey === 'users' || optionsKey === 'managers' || optionsKey === 'lawyers') ? 'users' : optionsKey;
      const res = await api.get(`/${endpoint}`);
      // Стандартизация: извлекаем массив данных из разных форматов ответа
      if (Array.isArray(res)) return res;
      if (res && typeof res === 'object') {
        if (Array.isArray(res.data))  return res.data;
        if (Array.isArray(res.items)) return res.items;
      }
      return [];
    },
    enabled:  Boolean(optionsKey) && optionsKey !== 'paymentKinds',
    staleTime: 10 * 60 * 1000,
  });
}

/** Поле выбора из справочника */
function SelectField({
  field,
  value,
  onChange,
}: {
  field: ReportFilterField;
  value: unknown;
  onChange: (v: string) => void;
}) {
  const { t } = useTranslation();
  const { data: options = [], isLoading } = useOptionsData(field.optionsKey);

  if (field.options?.length) {
    return (
      <Select value={String(value || '')} onValueChange={onChange}>
        <SelectTrigger className="h-8 text-sm">
          <SelectValue placeholder={t('reports.filters_all')} />
        </SelectTrigger>
        <SelectContent>
          {field.options
            .filter((opt) => opt.value !== undefined && opt.value !== null && String(opt.value) !== '')
            .map((opt) => (
              <SelectItem key={String(opt.value)} value={String(opt.value)}>{opt.label}</SelectItem>
            ))}
        </SelectContent>
      </Select>
    );
  }

  if (field.optionsKey === 'paymentKinds') {
    return (
        <Select value={String(value || 'all')} onValueChange={onChange}>
          <SelectTrigger className="h-8 text-sm">
            <SelectValue placeholder={t('reports.filters_all')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('reports.filters_all')}</SelectItem>
            <SelectItem value="income">{t('reports.filters_payment_kinds_income')}</SelectItem>
            <SelectItem value="expense">{t('reports.filters_payment_kinds_expense')}</SelectItem>
          </SelectContent>
        </Select>
    );
  }

  const searchableKeys = ['projects', 'contractors', 'lawyers', 'users', 'managers'];
  const isSearchable = field.optionsKey && searchableKeys.includes(field.optionsKey);

  if (isSearchable) {
    const searchableOptions = (options as OptionLike[]).filter(isOptionLike);

    return (
      <EntityCombobox
        value={value as string | number}
        onChange={(val) => onChange(val ? String(val) : 'all')}
        options={searchableOptions.map((opt) => ({ id: String(opt.id), label: opt.name || opt.label || String(opt.id) }))}
        placeholder={t('reports.filters_all')}
        disabled={isLoading}
        className="h-8 text-sm"
      />
    );
  }

  return (
      <Select value={String(value || 'all')} onValueChange={onChange} disabled={isLoading}>
        <SelectTrigger className="h-8 text-sm">
          <SelectValue placeholder={isLoading ? t('reports.filters_loading') : t('reports.filters_all')} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t('reports.filters_all')}</SelectItem>
        {(options as OptionLike[])
          .filter(isOptionLike)
          .filter((opt) => opt.id !== undefined && opt.id !== null && String(opt.id) !== '')
          .map((opt) => (
            <SelectItem key={String(opt.id)} value={String(opt.id)}>{opt.name || opt.label || String(opt.id)}</SelectItem>
          ))}
      </SelectContent>
    </Select>
  );
}

/**
 * Форма фильтров конструктора отчётов
 */
export function ReportFiltersForm({
  filterFields,
  filters,
  activePreset,
  onFilterChange,
  onPresetChange,
  onReset,
}: ReportFiltersFormProps) {
  const { t } = useTranslation();

  const entityFields = useMemo<Record<string, { value: string; label: string }[]>>(() => ({
    contracts: [
      { value: 'name', label: t('reports.filters_entity_fields_name') },
      { value: 'status', label: t('reports.filters_entity_fields_status') },
      { value: 'amount', label: t('reports.filters_entity_fields_amount') },
      { value: 'date', label: t('reports.filters_entity_fields_end_date') },
    ],
    projects: [
      { value: 'name', label: t('reports.filters_entity_fields_name') },
      { value: 'status', label: t('reports.filters_entity_fields_status') },
      { value: 'amount', label: t('reports.filters_entity_fields_budget') },
      { value: 'date', label: t('reports.filters_entity_fields_deadline') },
    ],
    tasks: [
      { value: 'name', label: t('reports.filters_entity_fields_name') },
      { value: 'status', label: t('reports.filters_entity_fields_status') },
      { value: 'date', label: t('reports.filters_entity_fields_task_due_date') },
    ],
    contractors: [
      { value: 'name', label: t('reports.filters_entity_fields_name') },
      { value: 'inn', label: t('reports.filters_entity_fields_inn') },
      { value: 'date', label: t('reports.filters_entity_fields_created_at') },
    ],
    finance: [
      { value: 'date', label: t('reports.filters_entity_fields_payment_date') },
      { value: 'kind', label: t('reports.filters_entity_fields_type') },
      { value: 'amount', label: t('reports.filters_entity_fields_amount') },
    ],
    marketing: [
      { value: 'name', label: t('reports.filters_entity_fields_name') },
      { value: 'status', label: t('reports.filters_entity_fields_status') },
      { value: 'amount', label: t('reports.filters_entity_fields_budget') },
      { value: 'date', label: t('reports.filters_entity_fields_end_date') },
    ]
  }), [t]);

  const operators = useMemo(() => [
    { value: '=', label: '=' },
    { value: '>', label: '>' },
    { value: '<', label: '<' },
    { value: '>=', label: '>=' },
    { value: '<=', label: '<=' },
    { value: 'like', label: t('reports.filters_operators_contains') },
    { value: 'is_null', label: t('reports.filters_operators_empty') },
    { value: 'is_not_null', label: t('reports.filters_operators_not_empty') },
  ], [t]);

  const datePresets = useMemo(() => [
    { value: 'this_month' as const,   label: t('reports.filters_date_presets_this_month') },
    { value: 'last_month' as const,   label: t('reports.filters_date_presets_last_month') },
    { value: 'this_quarter' as const, label: t('reports.filters_date_presets_this_quarter') },
    { value: 'this_year' as const,    label: t('reports.filters_date_presets_this_year') },
  ], [t]);

  const sourceEntity = String(filters.sourceEntity || '');
  const rules = (filters.rules as FilterRule[]) || [];

  const handleAddRule = () => {
    const fieldsForEntity = entityFields[sourceEntity] || [];
    if (fieldsForEntity.length === 0) return;
    const newRule: FilterRule = {
      field: fieldsForEntity[0].value,
      operator: '=',
      value: '',
    };
    onFilterChange('rules', [...rules, newRule]);
  };

  const handleRemoveRule = (index: number) => {
    const updated = [...rules];
    updated.splice(index, 1);
    onFilterChange('rules', updated.length > 0 ? updated : undefined);
  };

  const handleRuleChange = (index: number, key: keyof FilterRule, val: string) => {
    const updated = [...rules];
    updated[index] = { ...updated[index], [key]: val };
    onFilterChange('rules', updated);
  };

  const hasDateFields = filterFields.some(f => f.key === 'dateFrom' || f.key === 'dateTo');
  const otherFields   = filterFields.filter(f => f.key !== 'dateFrom' && f.key !== 'dateTo');

  const hasActiveFilters = Object.values(filters).some(v => v != null && v !== '');

  return (
    <div className="space-y-4">
      {/* Пресеты периода */}
      {hasDateFields && (
        <div className="space-y-3">
          <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            {t('reports.filters_period')}
          </Label>
          <div className="flex flex-wrap gap-2">
            {datePresets.map(p => (
              <button
                key={p.value}
                type="button"
                onClick={() => onPresetChange(p.value)}
                className={`px-3 py-1.5 text-xs rounded-md border transition-all ${
                  activePreset === p.value
                    ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                    : 'border-border hover:bg-muted/80'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Ввод дат вручную */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-[11px] font-medium text-muted-foreground ml-1">{t('reports.filters_from')}</Label>
              <Input
                type="date"
                value={String(filters.dateFrom || '')}
                onChange={e => onFilterChange('dateFrom', e.target.value || undefined)}
                className="h-9 text-sm px-2"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[11px] font-medium text-muted-foreground ml-1">{t('reports.filters_to')}</Label>
              <Input
                type="date"
                value={String(filters.dateTo || '')}
                onChange={e => onFilterChange('dateTo', e.target.value || undefined)}
                className="h-9 text-sm px-2"
              />
            </div>
          </div>
        </div>
      )}

      {/* Остальные фильтры */}
      {otherFields.map(field => (
        <div key={field.key} className="space-y-1.5">
          <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider ml-0.5">{field.label}</Label>
          {field.inputType === 'select' ? (
            <SelectField
              field={field}
              value={filters[field.key]}
              onChange={v => onFilterChange(field.key as keyof ReportFilters, v === 'all' ? undefined : v)}
            />
          ) : (
            <Input
              value={String(filters[field.key] || '')}
              onChange={e => onFilterChange(field.key as keyof ReportFilters, e.target.value || undefined)}
              className="h-9 text-sm"
              placeholder={t('reports.filters_all')}
            />
          )}
        </div>
      ))}

      {/* Конструктор правил (только для универсального отчёта) */}
      {sourceEntity && entityFields[sourceEntity] && (
        <div className="space-y-3 pt-3 border-t">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {t('reports.filters_conditions')}
            </Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddRule}
              className="h-7 text-xs gap-1 px-2"
            >
              <Plus className="w-3 h-3" />
              {t('common.add')}
            </Button>
          </div>

          <div className="space-y-2 max-h-56 overflow-y-auto pr-0.5">
            {rules.map((rule, idx) => (
              <div key={idx} className="flex gap-1 items-center bg-muted/20 p-1.5 rounded-lg border">
                <div className="flex-1 space-y-1">
                  {/* Выбор поля */}
                  <Select
                    value={rule.field}
                    onValueChange={(v) => handleRuleChange(idx, 'field', v)}
                  >
                    <SelectTrigger className="h-6 text-xs bg-background">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(entityFields[sourceEntity] || []).map((f) => (
                        <SelectItem key={f.value} value={f.value}>
                          {f.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* Выбор оператора */}
                  <Select
                    value={rule.operator}
                    onValueChange={(v) => handleRuleChange(idx, 'operator', v as any)}
                  >
                    <SelectTrigger className="h-6 text-xs bg-background">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {operators.map((op) => (
                        <SelectItem key={op.value} value={op.value}>
                          {op.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* Значение */}
                  {rule.operator !== 'is_null' && rule.operator !== 'is_not_null' && (
                    <Input
                      value={rule.value}
                      onChange={(e) => handleRuleChange(idx, 'value', e.target.value)}
                      placeholder={t('reports.filters_placeholder_value')}
                      className="h-6 text-xs bg-background px-1.5"
                    />
                  )}
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRemoveRule(idx)}
                  className="h-6 w-6 text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            ))}
            {rules.length === 0 && (
              <p className="text-[10px] text-muted-foreground text-center py-1 italic">
                {t('reports.filters_no_additional_conditions')}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Сброс фильтров */}
      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onReset}
          className="w-full text-xs h-8 text-muted-foreground hover:text-foreground"
        >
          {t('reports.filters_action_reset')}
        </Button>
      )}
    </div>
  );
}
