/**
 * Module Settings Editor Component
 * Displays and allows editing of module-specific settings
 */

import React, { useState } from "react";
import { useModuleSettings, useUpdateModuleSettings } from "../hooks";
import { ModuleSettings } from "../types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useTranslation } from "@/lib/i18n";
import { Loader2, Save, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCurrencies } from "@/hooks/useCurrencies";

// Маппинг полей, для которых нужны выпадающие списки, и их возможных значений
const OPTIONS_MAP: Record<string, string[]> = {
  priority:         ['low', 'medium', 'high', 'critical'],
  status:           ['active', 'inactive', 'pending', 'archived'],
  defaultView:      ['list', 'grid', 'kanban', 'calendar', 'table'],
  defaultSort:      ['date_desc', 'date_asc', 'name_asc', 'name_desc'],
  language:         ['ru', 'en'],
  visibility:       ['public', 'private', 'team'],
  priorityService:  ['dadata', 'apifns'],
  provider:         ['local', 's3'],
  mode:             ['auto', 'manual', 'hybrid', 'structured'],
  view:             ['list', 'grid', 'kanban', 'calendar', 'table'],
  on_fail:          ['skip', 'retry', 'stop'],
  type:             ['meeting', 'call', 'task', 'event', 'individual', 'company', 'incoming', 'outgoing'],
  invoice_type:     ['incoming', 'outgoing'],
  method:           ['cash', 'card', 'bank_transfer', 'sbp', 'e_money'],
};

// Специфичные для модулей переопределения списков
const MODULE_OPTIONS_MAP: Record<string, Record<string, string[]>> = {
  documents: {
    view: ['list', 'grid'],
    defaultView: ['list', 'grid']
  },
  tasks: {
    defaultView: ['list', 'kanban', 'calendar'],
  },
  projects: {
    defaultView: ['list', 'kanban'],
  }
};

interface ModuleSettingsEditorProps {
  moduleId: string;
  moduleName: string;
}

export function ModuleSettingsEditor({ moduleId, moduleName }: ModuleSettingsEditorProps) {
  const { t } = useTranslation();
  const { settings, isLoading, error } = useModuleSettings(moduleId);
  const updateModuleSettings = useUpdateModuleSettings();
  const [editedSettings, setEditedSettings] = useState<ModuleSettings>(settings);
  const [isDirty, setIsDirty] = useState(false);

  const [prevSettings, setPrevSettings] = useState(settings);
  if (settings !== prevSettings) {
    setPrevSettings(settings);
    setEditedSettings(settings);
    setIsDirty(false);
  }

  const handleNestedChange = (parentKey: string, childKey: string, value: unknown) => {
    setEditedSettings((prev) => {
      const parentValue = prev[parentKey];
      
      // Если дочерний ключ содержит точку (например 's3.endpoint')
      if (childKey.includes('.')) {
        const [subKey, deepKey] = childKey.split('.');
        const currentSubValue = ((parentValue as Record<string, unknown>)?.[subKey] as Record<string, unknown>) || {};
        
        return {
          ...prev,
          [parentKey]: {
            ...(typeof parentValue === "object" ? parentValue : {}),
            [subKey]: {
              ...currentSubValue,
              [deepKey]: value
            }
          }
        };
      }

      return {
        ...prev,
        [parentKey]: {
          ...(typeof parentValue === "object" ? parentValue : {}),
          [childKey]: value,
        },
      };
    });
    setIsDirty(true);
  };

  const handleSave = async () => {
    try {
      const changes: Record<string, unknown> = {};
      let hasChanges = false;

      for (const [key, value] of Object.entries(editedSettings)) {
        if (JSON.stringify(value) !== JSON.stringify(settings[key])) {
          changes[key] = value;
          hasChanges = true;
        }
      }

      if (hasChanges) {
        await updateModuleSettings.mutateAsync({ moduleId, settings: changes });
        toast.success(t('settings.module_params.success_save'));
      }
      setIsDirty(false);
    } catch (err) {
      console.error("Error saving settings:", err);
      toast.error(t('settings.module_params.errors.save'));
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          {t('settings.module_params.errors.load')}: {error instanceof Error ? error.message : "Unknown error"}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {Object.entries(editedSettings).map(([groupKey, groupValue]) => {
        if (typeof groupValue !== "object" || groupValue === null || Array.isArray(groupValue)) return null;
        const groupLabel = t(`settings.module_params.groups.${groupKey}`);
        
        // Плоский список полей для группы
        const fields: [string, unknown][] = [];
        Object.entries(groupValue as Record<string, unknown>).forEach(([fk, fv]) => {
          if (typeof fv === 'object' && fv !== null && !Array.isArray(fv)) {
            // Если это вложенный объект (например s3: { endpoint: ... })
            Object.entries(fv).forEach(([subK, subV]) => {
              fields.push([`${fk}.${subK}`, subV]);
            });
          } else {
            fields.push([fk, fv]);
          }
        });

        // Фильтрация полей S3 если выбран локальный провайдер и наоборот
        const provider = (groupValue as Record<string, unknown>).provider;
        const filteredFields = fields.filter(([key]) => {
          if (groupKey === 'storage_config') {
            if (provider === 'local' && key.startsWith('s3.')) return false;
            if (provider === 's3' && key.startsWith('local.')) return false;
            return true;
          }
          return true;
        });

        return (
          <Card key={groupKey}>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{groupLabel}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {filteredFields.map(([fieldKey, fieldValue]) => {
                // Для ключей вида "s3.endpoint" используем только вторую часть для перевода
                const displayKey = fieldKey.includes('.') ? fieldKey.split('.')[1] : fieldKey;
                return (
                  <SettingField
                    key={fieldKey}
                    fieldKey={displayKey}
                    value={fieldValue}
                    moduleId={moduleId}
                    onChange={(newValue) => handleNestedChange(groupKey, fieldKey, newValue)}
                  />
                );
              })}
            </CardContent>
          </Card>
        );
      })}

      <div className="flex gap-2">
        <Button onClick={handleSave} disabled={!isDirty || updateModuleSettings.isPending}>
          {updateModuleSettings.isPending ? (
            <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{t('common.saving')}</>
          ) : (
            <><Save className="mr-2 h-4 w-4" />{t('common.save')}</>
          )}
        </Button>
        <Button
          variant="outline"
          onClick={() => { setEditedSettings(settings); setIsDirty(false); }}
          disabled={!isDirty}
        >
          {t('common.cancel')}
        </Button>
      </div>

      {updateModuleSettings.isError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{t('settings.module_params.errors.save')}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}

interface SettingFieldProps {
  fieldKey: string;
  value: unknown;
  moduleId: string;
  onChange: (value: unknown) => void;
}

function SettingField({ fieldKey, value, moduleId, onChange }: SettingFieldProps) {
  const { t } = useTranslation();
  const { data: currencies = [] } = useCurrencies();
  
  let label = t(`settings.module_params.fields.${fieldKey}`);
  
  // Если перевод не найден, вернется сам ключ. Сделаем его чуть читаемее.
  if (label === `settings.module_params.fields.${fieldKey}`) {
    label = fieldKey.replace(/([A-Z])/g, ' $1').trim();
  }

  // Массивы и вложенные объекты не редактируются напрямую
  if (Array.isArray(value) || (typeof value === 'object' && value !== null)) return null;

  if (typeof value === "boolean") {
    return (
      <div className="flex items-center justify-between py-1">
        <Label htmlFor={fieldKey} className="font-normal cursor-pointer">{label}</Label>
        <Switch id={fieldKey} checked={value} onCheckedChange={onChange} />
      </div>
    );
  }

  if (typeof value === "number") {
    return (
      <div className="flex items-center justify-between gap-4">
        <Label htmlFor={fieldKey} className="font-normal flex-1">{label}</Label>
        <Input
          id={fieldKey}
          type="number"
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-32 text-right"
        />
      </div>
    );
  }

  if (typeof value === "string") {
    if (fieldKey === 'currency') {
      return (
        <div className="flex items-center justify-between gap-4">
          <Label htmlFor={fieldKey} className="font-normal flex-1">{label}</Label>
          <Select value={value as string} onValueChange={onChange}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder={t('common.select_placeholder', { defaultValue: 'Выберите...' })} />
            </SelectTrigger>
            <SelectContent>
              {currencies.map(c => (
                <SelectItem key={c.id} value={c.id}>
                  {c.id} - {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      );
    }

    // Получаем список вариантов (сначала специфичный для модуля, потом общий)
    const options = MODULE_OPTIONS_MAP[moduleId]?.[fieldKey] || OPTIONS_MAP[fieldKey];

    if (options) {
      return (
        <div className="flex items-center justify-between gap-4">
          <Label htmlFor={fieldKey} className="font-normal flex-1">{label}</Label>
          <Select value={value as string} onValueChange={onChange}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder={t('common.select_placeholder', { defaultValue: 'Выберите...' })} />
            </SelectTrigger>
            <SelectContent>
              {options
                .filter((optValue: string) => optValue !== undefined && optValue !== null && String(optValue) !== '')
                .map((optValue: string) => (
                <SelectItem key={String(optValue)} value={String(optValue)}>
                  {t(`settings.module_params.options.${fieldKey}.${optValue}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      );
    }

    return (
      <div className="flex items-center justify-between gap-4">
        <Label htmlFor={fieldKey} className="font-normal flex-1">{label}</Label>
        <Input
          id={fieldKey}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-48"
        />
      </div>
    );
  }

  return null;
}
