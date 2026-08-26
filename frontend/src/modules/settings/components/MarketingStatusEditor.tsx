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
import { useQueryClient } from '@tanstack/react-query';
import { useReferenceData } from '@/hooks/useReferenceData';

interface MarketingStatusEditorProps {
  onUpdate?: () => void;
}

interface MarketingStatus {
  id: string;
  name: string;
  color?: string;
  module?: string;
}

export function MarketingStatusEditor({ onUpdate }: MarketingStatusEditorProps) {
  const { t } = useTranslation();
  const { confirm } = useConfirm();
  const queryClient = useQueryClient();

  const { data: referenceData, isLoading, refetch } = useReferenceData();
  const statuses = referenceData?.marketingStatuses || [];

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
    color: '#6B7280',
  });

  const handleEdit = (status: MarketingStatus) => {
    setEditingId(status.id);
    setEditData({
      name: status.name,
      color: status.color || '#6B7280',
    });
  };

  const handleSaveEdit = async () => {
    if (!editingId || !editData.name.trim()) return;

    try {
      await api.put(`/references/marketing_status/${editingId}`, {
        name: editData.name.trim(),
        color: editData.color,
      });
      setEditingId(null);
      await refetch();
      queryClient.invalidateQueries({ queryKey: ['referenceData'] });
      onUpdate?.();
      toast.success(t('common.saved_successfully') || 'Сохранено');
    } catch (error) {
      toast.error(t('common.error_saving') || 'Ошибка при сохранении');
    }
  };

  const handleAdd = async () => {
    if (!newData.name.trim()) return;

    const id = newData.name.toLowerCase().replace(/\s+/g, '_');

    try {
      await api.post('/references/marketing_status', {
        id,
        name: newData.name.trim(),
        color: newData.color,
      });
      setNewData({
        name: '',
        color: '#6B7280',
      });
      setIsAdding(false);
      await refetch();
      queryClient.invalidateQueries({ queryKey: ['referenceData'] });
      onUpdate?.();
      toast.success(t('common.added_successfully') || 'Добавлено');
    } catch (error) {
      toast.error(t('common.error_adding') || 'Ошибка при добавлении');
    }
  };

  const handleDelete = async (id: string) => {
    if (
      await confirm({
        title: t('common.confirm_deletion') || 'Подтверждение удаления',
        description: t('common.confirm_deletion_text') || 'Это действие нельзя отменить.',
        variant: 'destructive',
      })
    ) {
      try {
        await api.delete(`/references/marketing_status/${id}`);
        await refetch();
        queryClient.invalidateQueries({ queryKey: ['referenceData'] });
        onUpdate?.();
        toast.success(t('common.deleted_successfully') || 'Удалено');
      } catch (error) {
        toast.error(t('common.error_deleting') || 'Ошибка при удалении');
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
          {t('marketing.settings.statuses') || 'Статусы маркетинговых кампаний'}
        </h3>
        <Button variant="outline" size="sm" onClick={() => setIsAdding(true)} disabled={isAdding}>
          <Plus className="w-4 h-4 mr-1" />
          {t('common.add')}
        </Button>
      </div>

      <div className="space-y-3">
        {statuses.map((status) => (
          <Card key={status.id} className="overflow-hidden">
            <CardContent className="p-4">
              {editingId === status.id ? (
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
                      name={editData.name || 'Статус'}
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
                      id={status.id}
                      name={status.name}
                      color={status.color}
                      variant="soft"
                      size="md"
                      shape="pill"
                    />
                    <span className="text-xs text-muted-foreground">ID: {status.id}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(status)}>
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDelete(status.id)}>
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
                  name={newData.name || 'Новый статус'}
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

        {statuses.length === 0 && !isAdding && (
          <p className="text-sm text-muted-foreground text-center py-4">
            {t('marketing.settings.no_statuses') || 'Нет статусов'}
          </p>
        )}
      </div>
    </div>
  );
}
