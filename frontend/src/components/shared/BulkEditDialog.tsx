import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { cn } from "@/lib/utils";
import { EntityCombobox } from "./EntityCombobox";
import type { ComboboxOption } from "./EntityCombobox";
import { TagMultiSelect } from "./TagMultiSelect";
import { api } from "@/lib/api";
import { toast } from "sonner";
import type { BulkEditFieldConfig } from "@/lib/types/bulk-edit.types";

export interface BulkEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (field: string, value: string) => void;
  count: number;
  moduleId: string;
  fields?: BulkEditFieldConfig[];
  title?: string;
  description?: string;
  referenceData?: Record<string, Array<{ id: string; name: string } | Record<string, unknown>>>;
}

export function BulkEditDialog({
  open,
  onOpenChange,
  onConfirm,
  count,
  moduleId,
  fields: propFields,
  title,
  description,
  referenceData = {},
}: BulkEditDialogProps) {
  const { t } = useTranslation();
  const [selectedField, setSelectedField] = useState<string>('');
  const [selectedValue, setSelectedValue] = useState<string>('');
  const [selectedTags, setSelectedTags] = useState<(string | number)[]>([]);
  const [creating, setCreating] = useState(false);
  const { data: remoteData, isLoading: loading } = useQuery({
    queryKey: ['module-settings', moduleId, 'bulk-edit'],
    queryFn: () => api.get(`/module-settings/${moduleId}/bulk-edit/enabled`),
    enabled: open && !propFields,
  });

  const fields = propFields || (remoteData?.fields as BulkEditFieldConfig[]) || [];

  const [prevSelectedField, setPrevSelectedField] = useState<string>('');
  const [prevOpen, setPrevOpen] = useState<boolean>(false);

  // Derived state pattern instead of useEffect
  if (selectedField !== prevSelectedField) {
    setPrevSelectedField(selectedField);
    setSelectedValue('');
    setSelectedTags([]);
  }

  if (open !== prevOpen) {
    setPrevOpen(open);
    if (!open) {
      setSelectedField(fields[0]?.id || '');
      setSelectedValue('');
      setSelectedTags([]);
    } else if (fields.length > 0) {
      setSelectedField(fields[0].id);
    }
  }

  // Handle case where fields load asynchronously
  const [prevFieldsLength, setPrevFieldsLength] = useState(0);
  if (fields.length !== prevFieldsLength) {
    setPrevFieldsLength(fields.length);
    if (open && fields.length > 0 && (!selectedField || !fields.find(f => f.id === selectedField))) {
      setSelectedField(fields[0].id);
    }
  }

  const currentField = fields.find(f => f.id === selectedField);

  const handleSave = () => {
    const isTags = currentField?.type === 'tags' || currentField?.id === 'tags';
    let value = selectedValue;
    
    if (isTags) {
      value = selectedTags.join(',');
    }

    if (selectedField && (value || (isTags && selectedTags.length === 0))) {
      onConfirm(selectedField, value);
      onOpenChange(false);
    }
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  const getFieldOptions = () => {
    if (!currentField) return [];
    if (currentField.dataSource) {
      const keysToTry = [
        currentField.dataSource,
        `${currentField.dataSourceModule}_${currentField.dataSource}`,
        currentField.dataSourceModule,
        currentField.id.replace('_id', 's'),
        currentField.id,
      ];
      for (const key of keysToTry) {
        if (key && referenceData[key] && Array.isArray(referenceData[key])) {
          return referenceData[key];
        }
      }
      const foundKey = Object.keys(referenceData).find(
        k => k.toLowerCase().includes((currentField.dataSource || '').toLowerCase())
      );
      if (foundKey && referenceData[foundKey]) return referenceData[foundKey];
    }
    return [];
  };

  const fieldOptions = getFieldOptions();
  const isComboboxField = currentField?.type === 'combobox' ||
                          ['project_id', 'task_id', 'contractor_id', 'lawyer_user_id', 'assignee', 'client_id', 'client', 'manager', 'court_id'].includes(currentField?.id || '');
  const isTagsField = currentField?.type === 'tags' || currentField?.id === 'tags';

  const handleCreate = async (name: string) => {
    if (!currentField) throw new Error(t('common.bulk_edit.field_not_selected'));
    setCreating(true);
    try {
      let newId: string | number | null = null;
      if (currentField.dataSource === 'projects') {
        const res = await api.post('/projects', { name });
        newId = res.data.id;
      } else if (currentField.dataSource === 'tasks') {
        const res = await api.post('/tasks', { title: name });
        newId = res.data.id;
      } else if (currentField.dataSource === 'contractors') {
        const res = await api.post('/contractors', { name });
        newId = res.data.id;
      } else if (currentField.dataSource === 'tags') {
        const res = await api.post('/references/defined_tags', { name, color: '#3B82F6', module: moduleId });
        newId = res.id;
      }
      if (!newId) throw new Error(t('common.bulk_edit.create_error'));
      toast.success(t('common.bulk_edit.created'), { 
        description: t('common.bulk_edit.record_created').replace('{0}', name) 
      });
      return newId;
    } catch (error: unknown) {
      toast.error(t('common.error'), { 
        description: error instanceof Error ? error.message : t('common.bulk_edit.create_error')
      });
      throw error;
    } finally {
      setCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{title || t('common.bulk_edit.title')} ({count})</DialogTitle>
          <DialogDescription>{description || t('common.bulk_edit.description')}</DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="py-8 text-center text-muted-foreground">{t('common.bulk_edit.loading_settings')}</div>
        ) : fields.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">{t('common.bulk_edit.no_fields')}</div>
        ) : (
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>{t('common.bulk_edit.field')}</Label>
              <Select value={selectedField} onValueChange={setSelectedField}>
                <SelectTrigger><SelectValue placeholder={t('common.bulk_edit.select_field')} /></SelectTrigger>
                <SelectContent>
                  {fields
                    .filter(f => f.id !== undefined && f.id !== null && String(f.id) !== '')
                    .map(field => <SelectItem key={String(field.id)} value={String(field.id)}>{field.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label>{t('common.bulk_edit.value')}</Label>
              {currentField?.type === 'select' && (
                <Select value={selectedValue} onValueChange={setSelectedValue}>
                  <SelectTrigger><SelectValue placeholder={t('common.bulk_edit.select_value')} /></SelectTrigger>
                  <SelectContent>
                      {fieldOptions
                        .filter((option: Record<string, unknown>) => option.id !== undefined && option.id !== null && String(option.id) !== '')
                        .map((option: Record<string, unknown>) => <SelectItem key={String(option.id)} value={String(option.id)}>{String(option.name)}</SelectItem>)}
                  </SelectContent>
                </Select>
              )}
              {isComboboxField && (
                <EntityCombobox
                  value={selectedValue}
                  onChange={(id) => setSelectedValue(typeof id === 'string' ? id : String(id))}
                  options={fieldOptions.map(o => ({ id: o.id, label: o.name }) as ComboboxOption)}
                  recentOptions={referenceData.recentUsers?.map((u: Record<string, unknown>) => ({ id: String(u.id), label: String(u.name) }))}
                  showRecentOnly={!!referenceData.recentUsers}
                  placeholder={t('common.bulk_edit.select_value')}
                  onCreate={['projects', 'tasks', 'contractors', 'tags'].includes(currentField?.dataSource || '') ? handleCreate : undefined}
                  createLabel={t('common.create') + ":"}
                />
              )}
              {currentField?.type === 'text' && <Input value={selectedValue} onChange={(e) => setSelectedValue(e.target.value)} placeholder={t('common.bulk_edit.enter_value')} />}
              {currentField?.type === 'number' && <Input type="number" value={selectedValue} onChange={(e) => setSelectedValue(e.target.value)} placeholder={t('common.bulk_edit.enter_number')} />}
              {currentField?.type === 'date' && <Input type="date" value={selectedValue} onChange={(e) => setSelectedValue(e.target.value)} />}
              {currentField?.type === 'boolean' && (
                <Select value={selectedValue} onValueChange={setSelectedValue}>
                  <SelectTrigger><SelectValue placeholder={t('common.bulk_edit.select_value')} /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">{t('common.yes')}</SelectItem>
                    <SelectItem value="false">{t('common.no')}</SelectItem>
                  </SelectContent>
                </Select>
              )}
              {currentField?.type === 'tags' && (
                <TagMultiSelect
                  value={selectedTags}
                  onChange={setSelectedTags}
                  options={fieldOptions.map(o => ({ id: o.id as string | number, name: o.name as string }))}
                  placeholder={t('generated.dobavit_teg')}
                  onCreate={handleCreate}
                  createLabel={t('common.create') + ":"}
                />
              )}
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>{t('common.cancel')}</Button>
          <Button onClick={handleSave} disabled={(isTagsField ? false : !selectedValue) || loading}>{t('common.save')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
