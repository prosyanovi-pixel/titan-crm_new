import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { TEMPLATE_KEYS } from '../hooks/useTemplates';
import { useTranslation } from '@/lib/i18n';
import { templatesApi } from '../api';
import { TemplateVariable, CreateVariablePayload } from '../types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Plus, Trash2, Edit2, Loader2, Save, X } from 'lucide-react';
import { useConfirm } from '@/components/ui/confirm-dialog';

interface Props {
  moduleId: string;
}

export const TemplateVariablesEditor = ({ moduleId }: Props) => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { confirm, alert } = useConfirm();

  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState<Partial<TemplateVariable>>({});

  const { data: variables = [], isLoading } = useQuery({
    queryKey: TEMPLATE_KEYS.variables(moduleId),
    queryFn: () => templatesApi.getVariables(moduleId),
  });

  const createMutation = useMutation({
    mutationFn: (payload: Omit<CreateVariablePayload, 'moduleId'>) => templatesApi.createVariable({ ...payload, moduleId } as CreateVariablePayload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TEMPLATE_KEYS.variables(moduleId) });
      setIsCreating(false);
      setFormData({});
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<TemplateVariable> }) => templatesApi.updateVariable(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TEMPLATE_KEYS.variables(moduleId) });
      setIsEditing(null);
      setFormData({});
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => templatesApi.deleteVariable(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TEMPLATE_KEYS.variables(moduleId) });
    },
  });

  const handleCreate = () => {
    setIsCreating(true);
    setFormData({ key: '{NewVariable}', name: '', dbPath: '', description: '' });
  };

  const handleEdit = (v: TemplateVariable) => {
    setIsEditing(v.id);
    setFormData({ key: v.key, name: v.name, dbPath: v.dbPath, description: v.description });
  };

  const handleSave = async () => {
    if (!formData.key || !formData.name || !formData.dbPath) {
      alert({ title: t('common.error'), description: 'Key, Name and DB Path are required.' });
      return;
    }

    if (isCreating) {
      createMutation.mutate(formData as Omit<CreateVariablePayload, 'moduleId'>);
    } else if (isEditing) {
      updateMutation.mutate({ id: isEditing, payload: formData });
    }
  };

  const handleCancel = () => {
    setIsCreating(false);
    setIsEditing(null);
    setFormData({});
  };

  const handleDelete = async (id: string) => {
    if (await confirm({
      title: t('common.confirm_deletion'),
      description: 'Are you sure you want to delete this variable?',
      variant: 'destructive',
    })) {
      deleteMutation.mutate(id);
    }
  };

  if (isLoading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin text-muted-foreground" /></div>;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Пользовательские переменные</CardTitle>
          <CardDescription>
            Добавьте новые переменные для шаблонов, указав путь до данных в базе.
          </CardDescription>
        </div>
        {!isCreating && !isEditing && (
          <Button onClick={handleCreate} size="sm">
            <Plus className="w-4 h-4 sm:mr-2" /> <span className="hidden sm:inline">Добавить</span>
          </Button>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {variables.map((variable) => (
            <div key={variable.id} className="flex flex-col gap-2 p-4 border rounded-lg bg-card">
              {isEditing === variable.id ? (
                <VariableForm
                  formData={formData}
                  setFormData={setFormData}
                  onSave={handleSave}
                  onCancel={handleCancel}
                  isPending={updateMutation.isPending}
                />
              ) : (
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-lg text-primary bg-primary/10 px-2 py-0.5 rounded">{variable.key}</span>
                      <span className="font-medium">{variable.name}</span>
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">Путь БД (lodash path): <code className="bg-muted px-1 py-0.5 rounded text-foreground">{variable.dbPath}</code></div>
                    {variable.description && <div className="text-sm mt-1">{variable.description}</div>}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(variable)} disabled={isCreating || !!isEditing}>
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(variable.id)} disabled={isCreating || !!isEditing} className="text-destructive hover:text-destructive">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))}

          {isCreating && (
            <div className="p-4 border rounded-lg bg-card border-primary">
              <VariableForm
                formData={formData}
                setFormData={setFormData}
                onSave={handleSave}
                onCancel={handleCancel}
                isPending={createMutation.isPending}
              />
            </div>
          )}

          {!isCreating && variables.length === 0 && (
            <div className="text-center text-muted-foreground py-8 border border-dashed rounded-lg">
              Нет добавленных переменных.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

interface VariableFormProps {
  formData: Partial<TemplateVariable>;
  setFormData: (data: Partial<TemplateVariable>) => void;
  onSave: () => void;
  onCancel: () => void;
  isPending: boolean;
}

function VariableForm({ formData, setFormData, onSave, onCancel, isPending }: VariableFormProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Ключ (плейсхолдер)</Label>
          <Input 
            value={formData.key || ''} 
            onChange={e => setFormData({ ...formData, key: e.target.value })} 
            placeholder="{ИмяПеременной}"
          />
        </div>
        <div className="space-y-2">
          <Label>Название</Label>
          <Input 
            value={formData.name || ''} 
            onChange={e => setFormData({ ...formData, name: e.target.value })} 
            placeholder="Название переменной"
          />
        </div>
        <div className="space-y-2">
          <Label>Путь в БД (JSON Path)</Label>
          <Input 
            value={formData.dbPath || ''} 
            onChange={e => setFormData({ ...formData, dbPath: e.target.value })} 
            placeholder="например: client.name или amount"
          />
        </div>
        <div className="space-y-2">
          <Label>Описание (опционально)</Label>
          <Input 
            value={formData.description || ''} 
            onChange={e => setFormData({ ...formData, description: e.target.value })} 
            placeholder="Краткое описание"
          />
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Button variant="outline" onClick={onCancel} disabled={isPending}>
          <X className="w-4 h-4 mr-2" /> Отмена
        </Button>
        <Button onClick={onSave} disabled={isPending}>
          {isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
          Сохранить
        </Button>
      </div>
    </div>
  );
}
