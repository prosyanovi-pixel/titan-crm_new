import { useState } from 'react';
import { Plus, Trash2, Edit2, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent } from '@/components/ui/card';
import { ColorPicker } from '@/components/ui/ColorPicker';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { useTranslation } from '@/lib/i18n';

interface LegalFormGroup {
  id: string;
  name: string;
  name_ru?: string;
  display_order: number;
  color: string;
  show_as_tab: boolean;
}

interface LegalFormGroupsEditorProps {
  groups: LegalFormGroup[];
  onRefresh: () => void;
}

export function LegalFormGroupsEditor({ groups, onRefresh }: LegalFormGroupsEditorProps) {
  const { t } = useTranslation();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<LegalFormGroup>>({});
  const [isAdding, setIsAdding] = useState(false);
  const [newData, setNewData] = useState<Partial<LegalFormGroup>>({
    name: '',
    color: '#3B82F6',
    show_as_tab: true,
  });

  const handleEdit = (group: LegalFormGroup) => {
    setEditingId(group.id);
    setEditData({ ...group });
  };

  const handleSaveEdit = async () => {
    if (!editingId || !editData.name?.trim()) return;

    try {
      await api.put(`/references/legal_form_groups/${editingId}`, editData);
      toast.success(t('generated.zapis_obnovlena'));
      setEditingId(null);
      onRefresh();
    } catch (e: unknown) {
      console.error('Error updating group:', e);
      toast.error(t('generated.oshibka_obnovleniya') + (e instanceof Error ? e.message : String(e)));
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
  };

  const handleAdd = async () => {
    if (!newData.name?.trim()) return;

    try {
      const id = newData.name.trim().toLowerCase()
        .replace(/\s+/g, '_')
        .replace(/[^a-zа-я0-9_]/gi, '')
        .slice(0, 30) || `group-${Date.now()}`;

      await api.post('/references/legal_form_groups', {
        id,
        name: newData.name.trim(),
        color: newData.color || '#3B82F6',
        show_as_tab: newData.show_as_tab ?? true,
        display_order: groups.length + 1,
      });

      toast.success(t('generated.zapis_dobavlena'));
      setNewData({ name: '', color: '#3B82F6', show_as_tab: true });
      setIsAdding(false);
      onRefresh();
    } catch (e: unknown) {
      console.error('Error adding group:', e);
      toast.error(t('generated.oshibka_dobavleniya') + (e instanceof Error ? e.message : String(e)));
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('common.confirm_deletion'))) return;

    try {
      await api.delete(`/references/legal_form_groups/${id}`);
      toast.success(t('generated.zapis_udalena'));
      onRefresh();
    } catch (e: unknown) {
      console.error('Error deleting group:', e);
      toast.error(t('generated.oshibka_udaleniya') + (e instanceof Error ? e.message : String(e)));
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-foreground">
          {t('settings.legal_forms.groups_list_title')}
        </h3>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsAdding(true)}
          disabled={isAdding}
        >
          <Plus className="w-4 h-4 mr-1" />
          {t('settings.legal_forms.add_group')}
        </Button>
      </div>

      <div className="space-y-2">
        {groups.map((group) => (
          <Card key={group.id}>
            <CardContent className="p-3">
              {editingId === group.id ? (
                <div className="flex items-center gap-3">
                  <div className="flex-1 space-y-2">
                    <Input
                      value={editData.name || ''}
                      onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                      className="h-9"
                      placeholder={t('settings.legal_forms.group_name_placeholder')}
                    />
                    <div className="flex items-center gap-4">
                      <ColorPicker
                        value={editData.color || '#3B82F6'}
                        onChange={(color) => setEditData({ ...editData, color })}
                      />
                      <Label className="flex items-center gap-2 text-sm">
                        <Switch
                          checked={editData.show_as_tab ?? true}
                          onCheckedChange={(checked) => setEditData({ ...editData, show_as_tab: checked })}
                        />
                        {t('settings.legal_forms.show_as_tab')}
                      </Label>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="h-9 w-9" onClick={handleSaveEdit}>
                    <Check className="w-4 h-4 text-green-500" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-9 w-9" onClick={handleCancelEdit}>
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
                    {group.show_as_tab ? t('settings.legal_forms.tab_badge') : t('settings.legal_forms.hidden_badge')}
                  </span>
                  <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => handleEdit(group)}>
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => handleDelete(group.id)}>
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}

        {isAdding && (
          <Card className="border-primary bg-primary/5">
            <CardContent className="p-3">
              <div className="flex items-center gap-3">
                <div className="flex-1 space-y-2">
                  <Label className="text-xs">{t('settings.legal_forms.group_name_label')}</Label>
                  <Input
                    value={newData.name || ''}
                    onChange={(e) => setNewData({ ...newData, name: e.target.value })}
                    className="h-9"
                    placeholder={t('settings.legal_forms.example_group')}
                    autoFocus
                  />
                  <div className="flex items-center gap-4">
                    <ColorPicker
                      value={newData.color || '#3B82F6'}
                      onChange={(color) => setNewData({ ...newData, color })}
                    />
                    <Label className="flex items-center gap-2 text-sm">
                      <Switch
                        checked={newData.show_as_tab ?? true}
                        onCheckedChange={(checked) => setNewData({ ...newData, show_as_tab: checked })}
                      />
                      {t('settings.legal_forms.show_as_tab')}
                    </Label>
                  </div>
                </div>
                <Button variant="ghost" size="icon" className="h-9 w-9 mt-4" onClick={handleAdd}>
                  <Check className="w-4 h-4 text-green-500" />
                </Button>
                <Button variant="ghost" size="icon" className="h-9 w-9 mt-4" onClick={() => setIsAdding(false)}>
                  <X className="w-4 h-4 text-destructive" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {groups.length === 0 && !isAdding && (
          <p className="text-sm text-muted-foreground text-center py-4">
            {t('settings.legal_forms.empty_state')}
          </p>
        )}
      </div>
    </div>
  );
}
