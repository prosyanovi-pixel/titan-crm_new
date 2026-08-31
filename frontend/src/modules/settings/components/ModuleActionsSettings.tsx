import React from "react";
import { ActionRegistry } from "@/modules/registry/ActionRegistry";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useTranslation } from "@/lib/i18n";
import { ModuleSettings } from "../types";

interface ModuleActionsSettingsProps {
  moduleId: string;
  editedSettings: ModuleSettings;
  onChange: (parentKey: string, childKey: string, value: boolean) => void;
}

export function ModuleActionsSettings({ moduleId, editedSettings, onChange }: ModuleActionsSettingsProps) {
  const { t } = useTranslation();
  
  // Получаем действия из реестра для текущего модуля
  const rowActions = ActionRegistry.getActionsForModule(moduleId, "row");
  const bulkActions = ActionRegistry.getActionsForModule(moduleId, "bulk");

  if (rowActions.length === 0 && bulkActions.length === 0) {
    return null;
  }

  const renderActionSwitches = (actions: typeof rowActions, groupKey: "rowActions" | "bulkActions") => {
    return actions.map((action) => {
      // По умолчанию действия включены, если не задано false
      const currentSettings = editedSettings[groupKey] as Record<string, boolean> | undefined;
      const isEnabled = currentSettings?.[action.id] !== false;
      const label = action.labelKey.includes(".") ? t(action.labelKey) : action.labelKey;

      return (
        <div key={action.id} className="flex items-center justify-between py-2">
          <div className="flex flex-col gap-1">
            <Label htmlFor={`${groupKey}-${action.id}`} className="font-medium cursor-pointer">
              {label}
            </Label>
            <span className="text-xs text-muted-foreground">ID: {action.id}</span>
          </div>
          <Switch
            id={`${groupKey}-${action.id}`}
            checked={isEnabled}
            onCheckedChange={(checked) => onChange(groupKey, action.id, checked)}
          />
        </div>
      );
    });
  };

  return (
    <>
      {rowActions.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{t('settings.module_params.groups.rowActions', { defaultValue: 'Действия в строках (Row Actions)' })}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {renderActionSwitches(rowActions, "rowActions")}
          </CardContent>
        </Card>
      )}

      {bulkActions.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{t('settings.module_params.groups.bulkActions', { defaultValue: 'Массовое редактирование (Bulk Actions)' })}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {renderActionSwitches(bulkActions, "bulkActions")}
          </CardContent>
        </Card>
      )}
    </>
  );
}
