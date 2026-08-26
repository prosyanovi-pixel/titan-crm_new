import { useState, useEffect } from "react";
import { useTranslation } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  GripVertical,
  Trash2,
  Plus,
  Eye,
  EyeOff,
} from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Save } from "lucide-react";
import type {
  ModuleBulkEditSettings,
  BulkEditFieldConfig,
  BulkEditFieldType,
} from "@/lib/types/bulk-edit.types";
import { getDefaultBulkEditSettings } from "@/lib/types/bulk-edit.types";

const FIELD_TYPES: BulkEditFieldType[] = [
  "select",
  "combobox",
  "text",
  "number",
  "date",
  "boolean",
  "tags"
];

const DATA_SOURCES = [
  "statuses",
  "priorities",
  "users",
  "contractors",
  "tags",
  "folders",
  "outcomes",
  "relationshipTypes",
  "legalForms"
];

interface SortableFieldRowProps {
  field: BulkEditFieldConfig;
  onUpdate: (field: BulkEditFieldConfig) => void;
  onDelete: () => void;
}

function SortableFieldRow({ field, onUpdate, onDelete }: SortableFieldRowProps) {
  const { t } = useTranslation();
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: field.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex flex-wrap items-center gap-2 p-3 bg-card border rounded-lg mb-2"
    >
      {/* Drag handle */}
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing p-1 hover:bg-accent rounded shrink-0"
      >
        <GripVertical className="w-4 h-4" />
      </div>

      {/* Enabled toggle */}
      <div className="flex items-center gap-2 shrink-0">
        <Switch
          id={`field-enabled-${field.id}`}
          checked={field.enabled}
          onCheckedChange={(checked) => onUpdate({ ...field, enabled: checked })}
        />
        <Label htmlFor={`field-enabled-${field.id}`} className="cursor-pointer shrink-0">
          {field.enabled ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
        </Label>
      </div>

      {/* Field ID и Label */}
      <div className="flex-1 min-w-[300px] grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label className="text-xs">{t('common.bulk_edit.settings.field_id')}</Label>
          <Input
            value={field.id}
            onChange={(e) => onUpdate({ ...field, id: e.target.value })}
            placeholder="status"
            className="h-8"
          />
        </div>

        {/* Field label */}
        <div className="space-y-1">
          <Label className="text-xs">{t('common.bulk_edit.settings.name')}</Label>
          <Input
            value={field.label}
            onChange={(e) => onUpdate({ ...field, label: e.target.value })}
            placeholder={t('common.status')}
            className="h-8"
          />
        </div>
      </div>

      {/* Field type */}
      <div className="space-y-1 w-[180px] shrink-0">
        <Label className="text-xs">{t('common.bulk_edit.settings.type')}</Label>
        <Select
          value={field.type}
          onValueChange={(value: BulkEditFieldType) =>
            onUpdate({ ...field, type: value })
          }
        >
          <SelectTrigger className="h-8">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {FIELD_TYPES.map((type) => (
              <SelectItem key={type} value={type}>
                {t(`common.bulk_edit.settings.field_types.${type}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Data source */}
      {(field.type === "select" || field.type === "combobox") && (
        <div className="space-y-1 w-[180px] shrink-0">
          <Label className="text-xs">{t('common.bulk_edit.settings.data_source')}</Label>
          <Select
            value={field.dataSource || ""}
            onValueChange={(value) =>
              onUpdate({ ...field, dataSource: value })
            }
          >
            <SelectTrigger className="h-8">
              <SelectValue placeholder={t('common.bulk_edit.settings.not_selected')} />
            </SelectTrigger>
            <SelectContent>
              {DATA_SOURCES.map((source) => (
                <SelectItem key={source} value={source}>
                  {t(`common.bulk_edit.settings.data_sources.${source}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Order */}
      <div className="space-y-1 w-[80px] shrink-0">
        <Label className="text-xs">{t('common.bulk_edit.settings.order')}</Label>
        <Input
          type="number"
          value={field.order}
          onChange={(e) =>
            onUpdate({ ...field, order: parseInt(e.target.value) || 0 })
          }
          className="h-8"
        />
      </div>

      {/* Delete button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={onDelete}
        className="text-destructive hover:text-destructive shrink-0"
      >
        <Trash2 className="w-4 h-4" />
      </Button>
    </div>
  );
}

interface BulkEditSettingsEditorProps {
  moduleId: string;
  moduleName: string;
  settings?: ModuleBulkEditSettings;
  onSave?: (settings: ModuleBulkEditSettings) => void;
}

export function BulkEditSettingsEditor({
  moduleId,
  moduleName,
  settings,
  onSave,
}: BulkEditSettingsEditorProps) {
  const { t } = useTranslation();
  const [localSettings, setLocalSettings] = useState<ModuleBulkEditSettings>();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showAddFieldDialog, setShowAddFieldDialog] = useState(false);
  const [availableFields, setAvailableFields] = useState<Array<{id: string; label: string}>>([]);
  const [selectedFieldId, setSelectedFieldId] = useState('');

  // Определяем доступные поля для модуля
  useEffect(() => { if (moduleId) {
      // Список возможных полей для каждого модуля
      const moduleFields: Record<string, Array<{id: string; label: string}>> = {
        contractors: [
          { id: 'status', label: t('common.status') },
          { id: 'type', label: t('common.bulk_edit.settings.data_sources.relationshipTypes') },
          { id: 'legal_form', label: t('common.bulk_edit.settings.data_sources.legalForms') },
          { id: 'manager', label: t('common.manager') },
          { id: 'email', label: t('common.email') },
          { id: 'phone', label: t('common.phone') },
          { id: 'tags', label: t('common.tags') },
        ],
        projects: [
          { id: 'status', label: t('common.status') },
          { id: 'priority', label: t('common.priority') },
          { id: 'manager', label: t('common.manager') },
          { id: 'contractor_id', label: t('common.client') },
          { id: 'budget', label: t('common.budget') },
          { id: 'deadline', label: t('common.deadline') },
          { id: 'tags', label: t('common.tags') },
        ],
        tasks: [
          { id: 'status', label: t('common.status') },
          { id: 'priority', label: t('common.priority') },
          { id: 'assignee', label: t('common.assignee') },
          { id: 'folder_id', label: t('common.bulk_edit.settings.data_sources.folders') },
          { id: 'project_id', label: t('common.project') },
          { id: 'due_date', label: t('common.term') },
          { id: 'tags', label: t('common.tags') },
        ],
        documents: [
          { id: 'folder_id', label: t('common.bulk_edit.settings.data_sources.folders') },
          { id: 'status', label: t('common.status') },
          { id: 'project_id', label: t('common.project') },
          { id: 'contractor_id', label: t('common.contractor') },
          { id: 'tags', label: t('common.tags') },
        ],
        finance: [
          { id: 'status', label: t('common.status_invoice') },
          { id: 'invoice_type', label: t('common.invoice_type') },
          { id: 'category_id', label: t('common.dds_article') },
          { id: 'contractor_id', label: t('common.contractor') },
          { id: 'project_id', label: t('common.project') },
          { id: 'task_id', label: t('common.task') },
          { id: 'lawyer_user_id', label: t('common.lawyer') },
          { id: 'method', label: t('common.payment_method') },
          { id: 'currency', label: t('common.currency') },
          { id: 'comment', label: t('common.comments') },
          { id: 'tags', label: t('common.tags') },
        ],
        lawyers: [
          { id: 'status', label: t('common.status') },
          { id: 'priority', label: t('common.priority') },
          { id: 'lawyer_user_id', label: t('common.lawyer') },
          { id: 'client_id', label: t('common.client') },
          { id: 'outcome', label: t('common.bulk_edit.settings.data_sources.outcomes') },
          { id: 'court_id', label: t('common.court') },
          { id: 'tags', label: t('common.tags') },
        ],
        calendar: [
          { id: 'status', label: t('common.status') },
          { id: 'type', label: t('common.type') },
          { id: 'assignee', label: t('common.responsible') },
          { id: 'client', label: t('common.client') },
          { id: 'project_id', label: t('common.project') },
          { id: 'tags', label: t('common.tags') },
        ],
      };

      const fields = moduleFields[moduleId] || [];
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setAvailableFields(fields);
    }
  }, [moduleId, t]);

  // Загружаем настройки из API если не переданы в props
  useEffect(() => {  
    if (settings) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLocalSettings(settings);
    } else {
      setLoading(true);
      api.get(`/module-settings/${moduleId}/bulk-edit`)
        .then(data => {
          // Если есть поля в ответе - используем их
          if (data && data.fields && data.fields.length > 0) {
            setLocalSettings({
              moduleId,
              moduleName: moduleName || moduleId,
              fields: data.fields || [],
              enabled: data.enabled ?? true,
              updatedAt: data.updatedAt,
            });
          } else {
            // Нет настроек - используем дефолтные
            const defaults = getDefaultBulkEditSettings(moduleId);
            if (defaults) {
              setLocalSettings(defaults);
            } else {
              // Нет дефолтных - создаём пустую конфигурацию
              setLocalSettings({
                moduleId,
                moduleName: moduleName || moduleId,
                fields: [],
                enabled: true,
                updatedAt: new Date().toISOString(),
              });
            }
          }
        })
        .catch(() => {
          // Ошибка API - используем дефолтные
          const defaults = getDefaultBulkEditSettings(moduleId);
          if (defaults) {
            setLocalSettings(defaults);
          } else {
            setLocalSettings({
              moduleId,
              moduleName: moduleName || moduleId,
              fields: [],
              enabled: true,
              updatedAt: new Date().toISOString(),
            });
          }
        })
        .finally(() => setLoading(false));
    }
  }, [settings, moduleId, moduleName]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || !localSettings) return;

    if (active.id !== over.id) {
      setLocalSettings((prev) => {
        if (!prev) return prev;
        const oldIndex = prev.fields.findIndex((f) => f.id === active.id);
        const newIndex = prev.fields.findIndex((f) => f.id === over.id);
        const newFields = arrayMove(prev.fields, oldIndex, newIndex);
        // Update order
        newFields.forEach((field, index) => {
          field.order = index + 1;
        });
        return { ...prev, fields: newFields };
      });
    }
  };

  const handleUpdateField = (
    fieldId: string,
    updatedField: BulkEditFieldConfig
  ) => {
    setLocalSettings((prev) => {
      if (!prev) return prev;
      const newFields = prev.fields.map((f) =>
        f.id === fieldId ? updatedField : f
      );
      return { ...prev, fields: newFields };
    });
  };

  const handleDeleteField = (fieldId: string) => {
    setLocalSettings((prev) => {
      if (!prev) return prev;
      const newFields = prev.fields.filter((f) => f.id !== fieldId);
      return { ...prev, fields: newFields };
    });
  };

  const handleAddField = () => {
    setShowAddFieldDialog(true);
  };

  const handleConfirmAddField = () => {
    if (!selectedFieldId) return;
    
    const fieldToAdd = availableFields.find(f => f.id === selectedFieldId);
    if (!fieldToAdd) return;
    
    setLocalSettings((prev) => {
      if (!prev) return prev;
      
      // Проверяем что поле ещё не добавлено
      if (prev.fields.some(f => f.id === selectedFieldId)) {
        return prev;
      }
      
      const newField: BulkEditFieldConfig = {
        id: fieldToAdd.id,
        label: fieldToAdd.label,
        type: fieldToAdd.id.includes('_id') ? 'combobox' : 
              fieldToAdd.id === 'tags' ? 'tags' :
              fieldToAdd.id === 'budget' ? 'number' :
              fieldToAdd.id === 'deadline' || fieldToAdd.id === 'due_date' ? 'date' :
              'select',
        dataSource: fieldToAdd.id === 'status' ? 'statuses' :
                   fieldToAdd.id === 'priority' ? 'priorities' :
                   fieldToAdd.id === 'tags' ? 'tags' :
                   fieldToAdd.id === 'folder_id' ? 'folders' :
                   fieldToAdd.id === 'project_id' ? 'projects' :
                   fieldToAdd.id === 'contractor_id' ? 'contractors' :
                   fieldToAdd.id === 'task_id' ? 'tasks' :
                   fieldToAdd.id === 'lawyer_user_id' || fieldToAdd.id === 'assignee' || fieldToAdd.id === 'manager' ? 'users' :
                   fieldToAdd.id === 'client_id' || fieldToAdd.id === 'client' ? 'contractors' :
                   fieldToAdd.id === 'court_id' ? 'courts' :
                   fieldToAdd.id === 'outcome' ? 'outcomes' :
                   fieldToAdd.id === 'type' ? 'relationshipTypes' :
                   fieldToAdd.id === 'legal_form' ? 'legalForms' :
                   fieldToAdd.id === 'invoice_type' ? 'invoiceTypes' :
                   fieldToAdd.id === 'category_id' ? 'expenseCategories' :
                   fieldToAdd.id === 'method' ? 'paymentMethods' :
                   fieldToAdd.id === 'currency' ? 'currencies' :
                   undefined,
        order: prev.fields.length + 1,
        enabled: true,
      };
      
      return { ...prev, fields: [...prev.fields, newField] };
    });
    
    setShowAddFieldDialog(false);
    setSelectedFieldId('');
  };

  const handleSave = () => {
    if (localSettings) {
      setSaving(true);
      const settingsToSave = {
        ...localSettings,
        updatedAt: new Date().toISOString(),
      };

      api.post(`/module-settings/${moduleId}/bulk-edit`, {
        fields: settingsToSave.fields,
        enabled: settingsToSave.enabled,
      })
        .then(data => {
          if (data.success) {
            toast.success(t('settings.module_params.success_save'));
            onSave?.(settingsToSave);
          } else {
            toast.error(t('settings.module_params.errors.save'));
            console.error('Error saving:', data.error);
          }
        })
        .catch(err => {
          toast.error(t('settings.module_params.errors.save'));
          console.error(err);
        })
        .finally(() => setSaving(false));
    }
  };

  const handleResetToDefaults = () => {
    const defaults = getDefaultBulkEditSettings(moduleId);
    if (defaults) {
      // Объединяем дефолтные поля с текущими (не удаляем существующие)
      setLocalSettings((prev) => {
        if (!prev || !defaults) return prev;
        
        // Создаём карту текущих полей по id
        const currentFieldsMap = new Map(prev.fields.map(f => [f.id, f]));
        
        // Добавляем дефолтные поля которых ещё нет
        defaults.fields.forEach(defaultField => {
          if (!currentFieldsMap.has(defaultField.id)) {
            currentFieldsMap.set(defaultField.id, defaultField);
          }
        });
        
        // Преобразуем обратно в массив и сортируем по order
        const newFields = Array.from(currentFieldsMap.values())
          .sort((a, b) => a.order - b.order);
        
        return {
          ...prev,
          fields: newFields,
          enabled: defaults.enabled,
        };
      });
    }
  };

  if (!localSettings) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('common.bulk_edit.settings.editor_title')}</CardTitle>
        <CardDescription>
          {t('common.bulk_edit.settings.editor_desc')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Global enable toggle */}
        <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
          <div className="space-y-0.5">
            <Label className="text-base">{t('common.bulk_edit.settings.enable')}</Label>
            <p className="text-sm text-muted-foreground">
              {t('common.bulk_edit.settings.enable_desc')}
            </p>
          </div>
          <Switch
            checked={localSettings.enabled}
            onCheckedChange={(checked) =>
              setLocalSettings({ ...localSettings, enabled: checked })
            }
          />
        </div>

        {/* Fields list */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>{t('common.bulk_edit.settings.fields_to_edit')}</Label>
            <Button variant="outline" size="sm" onClick={handleAddField}>
              <Plus className="w-4 h-4 mr-2" />
              {t('common.bulk_edit.settings.add_field')}
            </Button>
          </div>

          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={localSettings.fields.map((f) => f.id)}
              strategy={verticalListSortingStrategy}
            >
              {localSettings.fields
                .sort((a, b) => a.order - b.order)
                .map((field) => (
                  <SortableFieldRow
                    key={field.id}
                    field={field}
                    onUpdate={(updated) =>
                      handleUpdateField(field.id, updated)
                    }
                    onDelete={() => handleDeleteField(field.id)}
                  />
                ))}
            </SortableContext>
          </DndContext>

          {localSettings.fields.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">
              {t('common.bulk_edit.settings.no_fields')}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t">
          <Button
            variant="outline"
            onClick={handleResetToDefaults}
          >
            {t('common.bulk_edit.settings.reset_defaults')}
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            <Save className="w-4 h-4 mr-2" />
            {saving ? t('common.bulk_edit.settings.saving') : t('common.bulk_edit.settings.save_settings')}
          </Button>
        </div>
      </CardContent>

      {/* Dialog for adding field */}
      <Dialog open={showAddFieldDialog} onOpenChange={setShowAddFieldDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{t('common.bulk_edit.settings.add_field_title')}</DialogTitle>
            <DialogDescription>
              {t('common.bulk_edit.settings.add_field_desc')}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Select value={selectedFieldId} onValueChange={setSelectedFieldId}>
              <SelectTrigger>
                <SelectValue placeholder={t('common.bulk_edit.settings.select_field')} />
              </SelectTrigger>
              <SelectContent>
                {availableFields
                  .filter(f => !localSettings?.fields.some(existing => existing.id === f.id))
                  .map(field => (
                    <SelectItem key={field.id} value={field.id}>
                      {field.label}
                    </SelectItem>
                  ))
                }
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowAddFieldDialog(false);
              setSelectedFieldId('');
            }}>
              {t('common.bulk_edit.settings.cancel')}
            </Button>
            <Button onClick={handleConfirmAddField} disabled={!selectedFieldId}>
              {t('common.bulk_edit.settings.add')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
