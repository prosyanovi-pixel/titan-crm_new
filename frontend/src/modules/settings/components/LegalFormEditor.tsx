import { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus, Trash2, Edit2, Check, X, FolderOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { LegalFormItem, LegalFormGroupItem } from '../types';
import { ColorPicker } from '@/components/ui/ColorPicker';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { useTranslation } from '@/lib/i18n';
import { useConfirm } from '@/components/ui/confirm-dialog';

interface LegalFormEditorProps {
  legalForms: LegalFormItem[];
  onRefresh?: () => void;
}

export function LegalFormEditor({ legalForms, onRefresh }: LegalFormEditorProps) {
  const { t } = useTranslation();
  const { confirm } = useConfirm();
  const [activeTab, setActiveTab] = useState<'forms' | 'groups'>('forms');
  
  // Формы
  const [editingFormId, setEditingFormId] = useState<string | null>(null);
  const [editFormName, setEditFormName] = useState('');
  const [editFormColor, setEditFormColor] = useState('#3B82F6');
  const [editFormGroupId, setEditFormGroupId] = useState<string>('');
  const [editFormKeywords, setEditFormKeywords] = useState('');
  const [isAddingForm, setIsAddingForm] = useState(false);
  const [newFormName, setNewFormName] = useState('');
  const [newFormColor, setNewFormColor] = useState('#3B82F6');
  const [newFormGroupId, setNewFormGroupId] = useState('');
  const [newFormKeywords, setNewFormKeywords] = useState('');

  // Группы
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [editGroupName, setEditGroupName] = useState('');
  const [editGroupColor, setEditGroupColor] = useState('#3B82F6');
  const [editGroupShowAsTab, setEditGroupShowAsTab] = useState(true);
  const [isAddingGroup, setIsAddingGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupColor, setNewGroupColor] = useState('#3B82F6');
  const [newGroupShowAsTab, setNewGroupShowAsTab] = useState(true);

  // Загрузка групп
  const { data: groups = [], refetch } = useQuery({
    queryKey: ['settings-legal-form-groups'],
    queryFn: async () => {
      const data = await api.get('/references/legal_form_groups');
      return data as LegalFormGroupItem[];
    },
    staleTime: 5 * 60 * 1000,
  });

  // === ФОРМЫ ===

  const handleEditForm = (form: LegalFormItem) => {
    setEditingFormId(form.id);
    setEditFormName(form.name);
    setEditFormColor(form.color || '#3B82F6');
    setEditFormGroupId(form.groupId || '');
    setEditFormKeywords(form.keywords || '');
  };

  const handleSaveForm = async () => {
    if (!editingFormId || !editFormName.trim()) return;

    try {
      await api.put(`/references/legal_forms/${editingFormId}`, {
        name: editFormName.trim(),
        color: editFormColor,
        group_id: editFormGroupId || null,
        keywords: editFormKeywords.trim(),
      });
      toast.success(t('generated.zapis_obnovlena'));
      setEditingFormId(null);
      onRefresh?.();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : '';
      toast.error(t('generated.oshibka_obnovleniya') + msg);
    }
  };

  const handleAddForm = async () => {
    if (!newFormName.trim()) return;

    try {
      const id = newFormName.trim().toLowerCase()
        .replace(/\s+/g, '_')
        .replace(/[^a-zа-я0-9_]/gi, '')
        .slice(0, 30) || `form-${Date.now()}`;

      await api.post('/references/legal_forms', {
        id,
        name: newFormName.trim(),
        color: newFormColor,
        group_id: newFormGroupId || null,
        keywords: newFormKeywords.trim(),
      });

      toast.success(t('generated.zapis_dobavlena'));
      setNewFormName('');
      setNewFormColor('#3B82F6');
      setNewFormGroupId('');
      setNewFormKeywords('');
      setIsAddingForm(false);
      onRefresh?.();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : '';
      toast.error(t('generated.oshibka_dobavleniya') + msg);
    }
  };

  const handleDeleteForm = async (id: string) => {
    if (!await confirm({
      title: t('common.confirm_deletion'),
      description: t('common.confirm_deletion_text'),
      variant: 'destructive'
    })) return;

    try {
      await api.delete(`/references/legal_forms/${id}`);
      toast.success(t('generated.zapis_udalena'));
      onRefresh?.();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : '';
      toast.error(t('generated.oshibka_udaleniya') + msg);
    }
  };

  // === ГРУППЫ ===

  const handleEditGroup = (group: LegalFormGroupItem) => {
    setEditingGroupId(group.id);
    setEditGroupName(group.name);
    setEditGroupColor(group.color);
    setEditGroupShowAsTab(group.showAsTab);
  };

  const handleSaveGroup = async () => {
    if (!editingGroupId || !editGroupName.trim()) return;

    try {
      await api.put(`/references/legal_form_groups/${editingGroupId}`, {
        name: editGroupName.trim(),
        color: editGroupColor,
        showAsTab: editGroupShowAsTab,
      });
      toast.success(t('generated.zapis_obnovlena'));
      setEditingGroupId(null);
      
      // Reload groups
      await refetch();
      
      onRefresh?.();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : '';
      toast.error(t('generated.oshibka_obnovleniya') + msg);
    }
  };

  const handleAddGroup = async () => {
    if (!newGroupName.trim()) return;

    try {
      const id = newGroupName.trim().toLowerCase()
        .replace(/\s+/g, '_')
        .replace(/[^a-zа-я0-9_]/gi, '')
        .slice(0, 30) || `group-${Date.now()}`;

      await api.post('/references/legal_form_groups', {
        id,
        name: newGroupName.trim(),
        color: newGroupColor,
        showAsTab: newGroupShowAsTab,
        displayOrder: groups.length + 1,
      });

      toast.success(t('generated.zapis_dobavlena'));
      setNewGroupName('');
      setNewGroupColor('#3B82F6');
      setNewGroupShowAsTab(true);
      setIsAddingGroup(false);
      
      // Reload groups
      await refetch();
      
      onRefresh?.();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : '';
      toast.error(t('generated.oshibka_dobavleniya') + msg);
    }
  };

  const handleDeleteGroup = async (id: string) => {
    if (!await confirm({
      title: t('common.confirm_deletion'),
      description: t('common.confirm_deletion_text'),
      variant: 'destructive'
    })) return;

    try {
      await api.delete(`/references/legal_form_groups/${id}`);
      toast.success(t('generated.zapis_udalena'));
      
      // Reload groups
      await refetch();
      
      onRefresh?.();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : '';
      toast.error(t('generated.oshibka_udaleniya') + msg);
    }
  };

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'forms' | 'groups')}>
        <TabsList>
          <TabsTrigger value="forms" className="gap-2">
            <FolderOpen className="w-4 h-4" />
            {t('settings.legal_forms.tabs.forms')}
          </TabsTrigger>
          <TabsTrigger value="groups" className="gap-2">
            <FolderOpen className="w-4 h-4" />
            {t('settings.legal_forms.tabs.groups')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="forms" className="mt-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-foreground">
              {t('settings.legal_forms.list_title')}
            </h3>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsAddingForm(true)}
              disabled={isAddingForm}
            >
              <Plus className="w-4 h-4 mr-1" />
              {t('settings.legal_forms.add_form')}
            </Button>
          </div>

          <div className="space-y-2">
            {legalForms.map((form) => (
              <Card key={form.id}>
                <CardContent className="p-3">
                  {editingFormId === form.id ? (
                    <div className="flex items-center gap-3">
                      <div className="flex-1 space-y-2">
                        <Input
                          value={editFormName}
                          onChange={(e) => setEditFormName(e.target.value)}
                          className="h-9"
                          placeholder={t('settings.legal_forms.form_name_placeholder')}
                        />
                        <Input
                          value={editFormKeywords}
                          onChange={(e) => setEditFormKeywords(e.target.value)}
                          className="h-8 text-xs"
                          placeholder="Ключевые слова (напр. ооо, общество с ограниченной)"
                        />
                        <div className="flex items-center gap-4">
                          <ColorPicker
                            value={editFormColor}
                            onChange={setEditFormColor}
                          />
                          <Select value={editFormGroupId || 'none'} onValueChange={(v) => setEditFormGroupId(v === 'none' ? '' : v)}>
                            <SelectTrigger className="w-[200px]">
                              <SelectValue placeholder={t('settings.legal_forms.no_group')} />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">{t('settings.legal_forms.no_group')}</SelectItem>
                              {groups.map(g => (
                                <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="flex flex-col gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleSaveForm}>
                          <Check className="w-4 h-4 text-green-500" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditingFormId(null)}>
                          <X className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: form.color }}
                      />
                      <div className="flex-1">
                        <div className="font-medium text-sm">{form.name}</div>
                        {form.keywords && (
                          <div className="text-[10px] text-muted-foreground line-clamp-1 italic">
                            {form.keywords}
                          </div>
                        )}
                      </div>
                      {form.groupId && (
                        <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                          {groups.find(g => g.id === form.groupId)?.name || form.groupId}
                        </span>
                      )}
                      <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => handleEditForm(form)}>
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => handleDeleteForm(form.id)}>
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}

            {isAddingForm && (
              <Card className="border-primary bg-primary/5">
                <CardContent className="p-3">
                  <div className="flex items-center gap-3">
                    <div className="flex-1 space-y-2">
                      <Label className="text-xs">{t('settings.legal_forms.form_name_placeholder')}</Label>
                      <Input
                        value={newFormName}
                        onChange={(e) => setNewFormName(e.target.value)}
                        className="h-9"
                        placeholder={t('settings.legal_forms.example_form')}
                        autoFocus
                      />
                      <Input
                        value={newFormKeywords}
                        onChange={(e) => setNewFormKeywords(e.target.value)}
                        className="h-8 text-xs"
                        placeholder="Ключевые слова через запятую"
                      />
                      <div className="flex items-center gap-4">
                        <ColorPicker
                          value={newFormColor}
                          onChange={setNewFormColor}
                        />
                        <Select value={newFormGroupId || 'none'} onValueChange={(v) => setNewFormGroupId(v === 'none' ? '' : v)}>
                          <SelectTrigger className="w-[200px]">
                            <SelectValue placeholder={t('settings.legal_forms.no_group')} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">{t('settings.legal_forms.no_group')}</SelectItem>
                            {groups.map(g => (
                              <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleAddForm}>
                        <Check className="w-4 h-4 text-green-500" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setIsAddingForm(false)}>
                        <X className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="groups" className="mt-4">
          <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/50 p-4 rounded-lg mb-6 text-sm text-blue-800 dark:text-blue-300">
            <div className="flex items-center gap-2 font-bold mb-1">
              <FolderOpen className="w-4 h-4" />
              {t('settings.legal_forms.groups_info_title')}
            </div>
            {t('settings.legal_forms.groups_info_desc')}
          </div>

          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-foreground">
              {t('settings.legal_forms.groups_list_title')}
            </h3>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsAddingGroup(true)}
              disabled={isAddingGroup}
            >
              <Plus className="w-4 h-4 mr-1" />
              {t('settings.legal_forms.add_group')}
            </Button>
          </div>

          <div className="space-y-2">
            {groups.map((group) => (
              <Card key={group.id}>
                <CardContent className="p-3">
                  {editingGroupId === group.id ? (
                    <div className="flex items-center gap-3">
                      <div className="flex-1 space-y-2">
                        <Input
                          value={editGroupName}
                          onChange={(e) => setEditGroupName(e.target.value)}
                          className="h-9"
                          placeholder={t('settings.legal_forms.group_name_placeholder')}
                        />
                        <div className="flex items-center gap-4">
                          <ColorPicker
                            value={editGroupColor}
                            onChange={setEditGroupColor}
                          />
                          <Label className="flex items-center gap-2 text-sm">
                            <Switch
                              checked={editGroupShowAsTab}
                              onCheckedChange={setEditGroupShowAsTab}
                            />
                            {t('settings.legal_forms.show_as_tab')}
                          </Label>
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" className="h-9 w-9" onClick={handleSaveGroup}>
                        <Check className="w-4 h-4 text-green-500" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => setEditingGroupId(null)}>
                        <X className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: group.color }}
                      />
                      <span className="flex-1 font-medium">{group.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {group.showAsTab ? t('settings.legal_forms.tab_badge') : t('settings.legal_forms.hidden_badge')}
                      </span>
                      <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => handleEditGroup(group)}>
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => handleDeleteGroup(group.id)}>
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}

            {isAddingGroup && (
              <Card className="border-primary bg-primary/5">
                <CardContent className="p-3">
                  <div className="flex items-center gap-3">
                    <div className="flex-1 space-y-2">
                      <Label className="text-xs">{t('settings.legal_forms.group_name_label')}</Label>
                      <Input
                        value={newGroupName}
                        onChange={(e) => setNewGroupName(e.target.value)}
                        className="h-9"
                        placeholder={t('settings.legal_forms.example_group')}
                        autoFocus
                      />
                      <div className="flex items-center gap-4">
                        <ColorPicker
                          value={newGroupColor}
                          onChange={setNewGroupColor}
                        />
                        <Label className="flex items-center gap-2 text-sm">
                          <Switch
                            checked={newGroupShowAsTab}
                            onCheckedChange={setNewGroupShowAsTab}
                          />
                          {t('settings.legal_forms.show_as_tab')}
                        </Label>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" className="h-9 w-9 mt-4" onClick={handleAddGroup}>
                      <Check className="w-4 h-4 text-green-500" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-9 w-9 mt-4" onClick={() => setIsAddingGroup(false)}>
                      <X className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
