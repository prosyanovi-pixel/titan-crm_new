import React, { useState } from 'react';
import { Plus, Trash2, Edit2, Check, X, Users, Box, Wrench, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { useModuleSettings, useUpdateModuleSettings } from '../hooks';
import { useTranslation } from '@/lib/i18n';
import { useConfirm } from '@/components/ui/confirm-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import type { ModuleItem } from "../types";

interface TabsEditorProps {
  selectedModule: string;
  modules: ModuleItem[];
}

const AVAILABLE_ICONS = [
  { id: 'Users', icon: Users, label: 'Пользователи' },
  { id: 'Box', icon: Box, label: 'Коробка' },
  { id: 'Wrench', icon: Wrench, label: 'Инструмент' },
  { id: 'Settings', icon: Settings, label: 'Настройки' }
];

export function TabsEditor({ selectedModule, modules }: TabsEditorProps) {
  const { t } = useTranslation();
  const { confirm } = useConfirm();
  const currentModule = modules.find(m => m.id === selectedModule);

  const { settings, isLoading } = useModuleSettings(selectedModule);
  const updateSettings = useUpdateModuleSettings();

  const tabs = (settings?.tabs || []) as Array<{id: string, label: string, icon?: string, visible: boolean}>;

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState({ label: '', icon: 'Box', visible: true });

  const [isAdding, setIsAdding] = useState(false);
  const [newData, setNewData] = useState({ id: '', label: '', icon: 'Box', visible: true });

  const handleSave = async (updatedTabs: any[]) => {
    await updateSettings.mutateAsync({
      moduleId: selectedModule,
      settings: { tabs: updatedTabs }
    });
  };

  const handleEdit = (tab: any) => {
    setEditingId(tab.id);
    setEditData({ label: tab.label, icon: tab.icon || 'Box', visible: tab.visible ?? true });
  };

  const handleSaveEdit = async () => {
    if (!editData.label.trim()) return;
    const newTabs = tabs.map(t => t.id === editingId ? { ...t, ...editData } : t);
    await handleSave(newTabs);
    setEditingId(null);
  };

  const handleAdd = async () => {
    if (!newData.label.trim() || !newData.id.trim()) return;
    const newTabs = [...tabs, newData];
    await handleSave(newTabs);
    setIsAdding(false);
    setNewData({ id: '', label: '', icon: 'Box', visible: true });
  };

  const handleDelete = async (id: string) => {
    const yes = await confirm({
      title: t('common.delete'),
      description: t('settings.module_params.errors.confirm_delete')
    });
    if (yes) {
      const newTabs = tabs.filter(t => t.id !== id);
      await handleSave(newTabs);
    }
  };

  if (isLoading) return <div>{t('common.loading')}...</div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Вкладки ({currentModule?.name})</h3>
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
                  placeholder="ID (совпадает с ID типа)" 
                  value={newData.id} 
                  onChange={e => setNewData({...newData, id: e.target.value})} 
                />
              </div>
              <div className="flex-1 space-y-2">
                <Input 
                  placeholder={t('common.name')} 
                  value={newData.label} 
                  onChange={e => setNewData({...newData, label: e.target.value})} 
                />
              </div>
              <div className="w-full sm:w-auto">
                <Select value={newData.icon} onValueChange={(val) => setNewData({...newData, icon: val})}>
                  <SelectTrigger className="w-full sm:w-[140px]">
                    <SelectValue placeholder="Иконка" />
                  </SelectTrigger>
                  <SelectContent>
                    {AVAILABLE_ICONS.map(i => (
                      <SelectItem key={i.id} value={i.id}>
                        <div className="flex items-center gap-2">
                          <i.icon className="w-4 h-4" />
                          <span>{i.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={newData.visible} onCheckedChange={(val) => setNewData({...newData, visible: val})} />
                <span className="text-sm">Видна</span>
              </div>
              <div className="flex items-center gap-2 pt-2 sm:pt-0">
                <Button size="icon" onClick={handleAdd} disabled={!newData.label || !newData.id}><Check className="w-4 h-4" /></Button>
                <Button size="icon" variant="outline" onClick={() => setIsAdding(false)}><X className="w-4 h-4" /></Button>
              </div>
            </CardContent>
          </Card>
        )}

        {tabs.map(tab => {
          const IconComp = AVAILABLE_ICONS.find(i => i.id === tab.icon)?.icon || Box;
          return (
            <Card key={tab.id}>
              <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                {editingId === tab.id ? (
                  <>
                    <div className="flex-1 space-y-2">
                      <Input 
                        value={editData.label} 
                        onChange={e => setEditData({...editData, label: e.target.value})} 
                      />
                    </div>
                    <div className="w-full sm:w-auto">
                      <Select value={editData.icon} onValueChange={(val) => setEditData({...editData, icon: val})}>
                        <SelectTrigger className="w-full sm:w-[140px]">
                          <SelectValue placeholder="Иконка" />
                        </SelectTrigger>
                        <SelectContent>
                          {AVAILABLE_ICONS.map(i => (
                            <SelectItem key={i.id} value={i.id}>
                              <div className="flex items-center gap-2">
                                <i.icon className="w-4 h-4" />
                                <span>{i.label}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch checked={editData.visible} onCheckedChange={(val) => setEditData({...editData, visible: val})} />
                      <span className="text-sm">Видна</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button size="icon" onClick={handleSaveEdit} disabled={!editData.label}><Check className="w-4 h-4" /></Button>
                      <Button size="icon" variant="outline" onClick={() => setEditingId(null)}><X className="w-4 h-4" /></Button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-3">
                      <IconComp className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium">{tab.label}</span>
                      <span className="text-xs text-muted-foreground ml-2 bg-muted px-2 py-1 rounded-md font-mono">{tab.id}</span>
                      {!tab.visible && <span className="text-xs text-destructive ml-2">(Скрыта)</span>}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(tab)}><Edit2 className="w-4 h-4 text-muted-foreground" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(tab.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          );
        })}
        {tabs.length === 0 && !isAdding && (
          <div className="text-center py-8 text-muted-foreground border rounded-lg border-dashed">
            {t('common.no_data')}
          </div>
        )}
      </div>
    </div>
  );
}
