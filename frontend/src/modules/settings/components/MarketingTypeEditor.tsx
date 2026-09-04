import { useState } from 'react';
import { Plus, Trash2, Edit2, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { ColorPicker } from '@/components/ui/ColorPicker';
import { Badge } from '@/components/ui/status-system';
import { useTranslation } from '@/lib/i18n';
import { useConfirm } from '@/components/ui/confirm-dialog';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { useSettings } from '@/hooks/use-settings';
import { useQueryClient } from '@tanstack/react-query';

interface MarketingTypeEditorProps {
  onUpdate?: () => void;
}

interface MarketingType {
  id: string;
  name: string;
  color?: string;
  order?: number;
}

export function MarketingTypeEditor({ onUpdate }: MarketingTypeEditorProps) {
  const { t } = useTranslation();
  const { confirm } = useConfirm();
  const queryClient = useQueryClient();

  const settings = useSettings();
  const { refresh, loading: isLoading } = settings;
  const types = (settings.marketingTypes || []) as unknown as MarketingType[];

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<{
    name: string;
    color: string;
  }>({
    name: '',
    color: '',
  });

  const [isAdding, setIsAdding] = useState(false);
  const [newData, setNewData] = useState<{
    name: string;
    color: string;
  }>({
    name: '',
    color: '#3B82F6',
  });

  const handleEdit = (type: MarketingType) => {
    setEditingId(type.id);
    setEditData({
      name: type.name,
      color: type.color || '#3B82F6',
    });
  };

  const handleSaveEdit = async () => {
    if (!editingId || !editData.name.trim()) return;

    try {
      await api.put(`/references/marketing_type/${editingId}`, {
        name: editData.name.trim(),
        color: editData.color,
      });
      setEditingId(null);
      await refresh();
      queryClient.invalidateQueries({ queryKey: ['referenceData'] });
      onUpdate?.();
      toast.success(t('common.saved_successfully'));
    } catch (error) {
      toast.error(t('common.error_saving'));
    }
  };

  const handleAdd = async () => {
    if (!newData.name.trim()) return;

    const id = newData.name.toLowerCase().replace(/\s+/g, '_');

    try {
      await api.post('/references/marketing_type', {
        id,
        name: newData.name.trim(),
        color: newData.color,
      });
      setNewData({
        name: '',
        color: '#3B82F6',
      });
      setIsAdding(false);
      await refresh();
      queryClient.invalidateQueries({ queryKey: ['referenceData'] });
      onUpdate?.();
      toast.success(t('common.added_successfully'));
    } catch (error) {
      toast.error(t('common.error_adding'));
    }
  };

  const handleDelete = async (id: string) => {
    if (
      await confirm({
        title: t('common.confirm_deletion'),
        description: t('common.confirm_deletion_text'),
        variant: 'destructive',
      })
    ) {
      try {
        await api.delete(`/references/marketing_type/${id}`);
        await refresh();
        queryClient.invalidateQueries({ queryKey: ['referenceData'] });
        onUpdate?.();
        toast.success(t('common.deleted_successfully'));
      } catch (error) {
        toast.error(t('common.error_deleting'));
      }
    }
  };

  if (isLoading) {
    return <div className="text-center py-8 text-muted-foreground">{t('common.loading')}</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-foreground">
          {t('marketing.settings.types')}
        </h3>
        <Button variant="outline" size="sm" onClick={() => setIsAdding(true)} disabled={isAdding}>
          <Plus className="w-4 h-4 mr-1" />
          {t('common.add')}
        </Button>
      </div>

      <div className="space-y-3">
        {types.map((type) => (
          <Card key={type.id} className="overflow-hidden">
            <CardContent className="p-4">
              {editingId === type.id ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs uppercase text-muted-foreground font-semibold">
                        {t('settings.badge_editor.main')}
                      </Label>
                      <Input
                        value={editData.name}
                        onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                        className="h-9"
                        placeholder={t('settings.badge_editor.name_placeholder')}
                      />
                      <ColorPicker value={editData.color} onChange={(color) => setEditData({ ...editData, color })} />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t">
                    <Badge
                      id="preview"
                      name={editData.name || t('marketing.campaigns.type')}
                      color={editData.color}
                      variant="soft"
                      size="md"
                      shape="pill"
                    />
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm" onClick={() => setEditingId(null)} className="h-9">
                        <X className="w-4 h-4 mr-1" />
                        {t('common.cancel')}
                      </Button>
                      <Button variant="default" size="sm" onClick={handleSaveEdit} className="h-9">
                        <Check className="w-4 h-4 mr-1" />
                        {t('common.save')}
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between group">
                  <div className="flex items-center gap-4">
                    <Badge
                      id={type.id}
                      name={type.name}
                      color={type.color}
                      variant="soft"
                      size="md"
                      shape="pill"
                    />
                    <span className="text-xs text-muted-foreground">ID: {type.id}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(type)}>
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDelete(type.id)}>
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}

        {isAdding && (
          <Card className="border-primary/50 bg-primary/5 border-dashed">
            <CardContent className="p-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-semibold">{t('settings.badge_editor.main')}</Label>
                  <Input
                    value={newData.name}
                    onChange={(e) => setNewData({ ...newData, name: e.target.value })}
                    className="h-9"
                    placeholder={t('settings.badge_editor.name_placeholder')}
                    autoFocus
                  />
                  <ColorPicker value={newData.color} onChange={(color) => setNewData({ ...newData, color })} />
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-primary/10">
                <Badge
                  id="preview-new"
                  name={newData.name || t('common.new')}
                  color={newData.color}
                  variant="soft"
                  size="md"
                  shape="pill"
                />
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={() => setIsAdding(false)}>
                    {t('common.cancel')}
                  </Button>
                  <Button size="sm" onClick={handleAdd}>
                    <Check className="w-4 h-4 mr-1" />
                    {t('common.add')}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {types.length === 0 && !isAdding && (
          <p className="text-sm text-muted-foreground text-center py-4">
            {t('marketing.settings.no_types')}
          </p>
        )}
      </div>
    </div>
  );
}
