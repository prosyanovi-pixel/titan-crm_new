import React, { useState } from 'react';
import { Plus, Trash2, Edit2, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { useModuleSettings, useUpdateModuleSettings } from '../hooks';
import { useTranslation } from '@/lib/i18n';
import { useConfirm } from '@/components/ui/confirm-dialog';
import { ColorPicker } from '@/components/ui/ColorPicker';
import type { ModuleItem } from "../types";

interface TypesEditorProps {
  selectedModule: string;
  modules: ModuleItem[];
}

export function TypesEditor({ selectedModule, modules }: TypesEditorProps) {
  const { t } = useTranslation();
  const { confirm } = useConfirm();
  const currentModule = modules.find(m => m.id === selectedModule);

  const { settings, isLoading } = useModuleSettings(selectedModule);
  const updateSettings = useUpdateModuleSettings();

  const types = (settings?.types || []) as Array<{id: string, name: string, color?: string}>;

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState({ name: '', color: '#3b82f6' });

  const [isAdding, setIsAdding] = useState(false);
  const [newData, setNewData] = useState({ id: '', name: '', color: '#3b82f6' });

  const handleSave = async (updatedTypes: any[]) => {
    await updateSettings.mutateAsync({
      moduleId: selectedModule,
      settings: { types: updatedTypes }
    });
  };

  const handleEdit = (type: any) => {
    setEditingId(type.id);
    setEditData({ name: type.name, color: type.color || '#3b82f6' });
  };

  const handleSaveEdit = async () => {
    if (!editData.name.trim()) return;
    const newTypes = types.map(t => t.id === editingId ? { ...t, ...editData } : t);
    await handleSave(newTypes);
    setEditingId(null);
  };

  const handleAdd = async () => {
    if (!newData.name.trim() || !newData.id.trim()) return;
    const newTypes = [...types, newData];
    await handleSave(newTypes);
    setIsAdding(false);
    setNewData({ id: '', name: '', color: '#3b82f6' });
  };

  const handleDelete = async (id: string) => {
    const yes = await confirm({
      title: t('common.delete'),
      description: t('settings.module_params.errors.confirm_delete')
    });
    if (yes) {
      const newTypes = types.filter(t => t.id !== id);
      await handleSave(newTypes);
    }
  };

  if (isLoading) return <div>{t('common.loading')}...</div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">{t('settings.types_editor.title', { module: currentModule?.name })}</h3>
        <Button onClick={() => setIsAdding(true)} disabled={isAdding} size="sm">
          <Plus className="w-4 h-4 mr-2" />
          {t('common.add')}
        </Button>
      </div>

      <div className="grid gap-3">
        {isAdding && (
          <Card className="border-primary">
            <CardContent className="p-4 flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="flex-1 space-y-2">
                <Input 
                  placeholder={t('settings.types_editor.id_placeholder')} 
                  value={newData.id} 
                  onChange={e => setNewData({...newData, id: e.target.value})} 
                />
              </div>
              <div className="flex-1 space-y-2">
                <Input 
                  placeholder={t('common.name')} 
                  value={newData.name} 
                  onChange={e => setNewData({...newData, name: e.target.value})} 
                />
              </div>
              <div className="w-full sm:w-auto">
                <ColorPicker
                  value={newData.color}
                  onChange={(color) => setNewData({...newData, color})}
                />
              </div>
              <div className="flex items-center gap-2 pt-2 sm:pt-0">
                <Button size="icon" onClick={handleAdd} disabled={!newData.name || !newData.id}><Check className="w-4 h-4" /></Button>
                <Button size="icon" variant="outline" onClick={() => setIsAdding(false)}><X className="w-4 h-4" /></Button>
              </div>
            </CardContent>
          </Card>
        )}

        {types.map(type => (
          <Card key={type.id}>
            <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              {editingId === type.id ? (
                <>
                  <div className="flex-1 space-y-2">
                    <Input 
                      value={editData.name} 
                      onChange={e => setEditData({...editData, name: e.target.value})} 
                    />
                  </div>
                  <div className="w-full sm:w-auto">
                    <ColorPicker
                      value={editData.color}
                      onChange={(color) => setEditData({...editData, color})}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="icon" onClick={handleSaveEdit} disabled={!editData.name}><Check className="w-4 h-4" /></Button>
                    <Button size="icon" variant="outline" onClick={() => setEditingId(null)}><X className="w-4 h-4" /></Button>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: type.color || '#3b82f6' }} />
                    <span className="font-medium">{type.name}</span>
                    <span className="text-xs text-muted-foreground ml-2 bg-muted px-2 py-1 rounded-md font-mono">{type.id}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(type)}><Edit2 className="w-4 h-4 text-muted-foreground" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(type.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        ))}
        {types.length === 0 && !isAdding && (
          <div className="text-center py-8 text-muted-foreground border rounded-lg border-dashed">
            {t('common.no_data')}
          </div>
        )}
      </div>
    </div>
  );
}
