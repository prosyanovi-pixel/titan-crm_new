import { useState } from 'react';
import { Plus, Trash2, Edit2, Check, X, Palette, Sparkles, Wand2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { ColorPicker } from '@/components/ui/ColorPicker';
import { IconPicker } from '@/components/ui/IconPicker';
import { Badge, useStatuses, useCreateStatus, useUpdateStatus, useDeleteStatus } from '@/components/ui/status-system';
import { useTranslation } from '@/lib/i18n';
import { useConfirm } from '@/components/ui/confirm-dialog';
import type { BadgeVariant, BadgeSize, BadgeShape } from '@/components/ui/status-system';
import type { ModuleItem } from "../types";

interface StatusEditorProps {
  selectedModule: string;
  modules: ModuleItem[];
}

export function StatusEditor({ selectedModule, modules }: StatusEditorProps) {
  const { t } = useTranslation();
  const { confirm } = useConfirm();
  const currentModule = modules.find(m => m.id === selectedModule);

  const { statuses, isLoading } = useStatuses({ module: selectedModule });
  const createStatus = useCreateStatus();
  const updateStatus = useUpdateStatus();
  const deleteStatus = useDeleteStatus();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<{
    name: string;
    color: string;
    variant: BadgeVariant;
    size: BadgeSize;
    shape: BadgeShape;
    icon?: string;
    isGlass: boolean;
    isGradient: boolean;
    secondaryColor?: string;
    isAnimated: boolean;
  }>({
    name: '',
    color: '',
    variant: 'solid',
    size: 'md',
    shape: 'rounded',
    icon: undefined,
    isGlass: false,
    isGradient: false,
    secondaryColor: undefined,
    isAnimated: false,
  });

  const [isAdding, setIsAdding] = useState(false);
  const [newData, setNewData] = useState<{
    name: string;
    color: string;
    variant: BadgeVariant;
    size: BadgeSize;
    shape: BadgeShape;
    icon?: string;
    isGlass: boolean;
    isGradient: boolean;
    secondaryColor?: string;
    isAnimated: boolean;
  }>({
    name: '',
    color: '#6B7280',
    variant: 'solid',
    size: 'md',
    shape: 'rounded',
    icon: undefined,
    isGlass: false,
    isGradient: false,
    secondaryColor: undefined,
    isAnimated: false,
  });

  const handleEdit = (status: {
    id: string;
    name: string;
    color: string;
    variant?: BadgeVariant;
    size?: BadgeSize;
    shape?: BadgeShape;
    icon?: string;
    isGlass?: boolean;
    isGradient?: boolean;
    secondaryColor?: string;
    isAnimated?: boolean;
  }) => {
    setEditingId(status.id);
    setEditData({
      name: status.name,
      color: status.color,
      variant: status.variant || 'solid',
      size: status.size || 'md',
      shape: status.shape || 'rounded',
      icon: status.icon,
      isGlass: !!status.isGlass,
      isGradient: !!status.isGradient,
      secondaryColor: status.secondaryColor,
      isAnimated: !!status.isAnimated,
    });
  };

  const handleSaveEdit = () => {
    if (!editingId || !editData.name.trim()) return;

    updateStatus.mutate(
      {
        id: editingId,
        ...editData,
        name: editData.name.trim(),
      },
      {
        onSuccess: () => {
          setEditingId(null);
        },
      }
    );
  };

  const handleAdd = () => {
    if (!newData.name.trim()) return;

    createStatus.mutate(
      {
        ...newData,
        name: newData.name.trim(),
        module: selectedModule,
      },
      {
        onSuccess: () => {
          setNewData({
            name: '',
            color: '#6B7280',
            variant: 'solid',
            size: 'md',
            shape: 'rounded',
            icon: undefined,
            isGlass: false,
            isGradient: false,
            secondaryColor: undefined,
            isAnimated: false,
          });
          setIsAdding(false);
        },
      }
    );
  };

  const handleDelete = async (id: string) => {
    if (
      await confirm({
        title: t('common.confirm_deletion'),
        description: t('common.confirm_deletion_text'),
        variant: 'destructive',
      })
    ) {
      deleteStatus.mutate(id);
    }
  };

  if (isLoading) {
    return <div className="text-center py-8 text-muted-foreground">{t('common.loading')}</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-foreground">
          {t('settings.statuses.for_module').replace('{module}', currentModule?.name || '')}
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
                      <Label className="text-xs uppercase text-muted-foreground font-semibold">{t('settings.badge_editor.main')}</Label>
                      <Input
                        value={editData.name}
                        onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                        className="h-9"
                        placeholder={t('settings.badge_editor.name_placeholder')}
                      />
                      <div className="flex items-center gap-2">
                        <ColorPicker value={editData.color} onChange={(color) => setEditData({ ...editData, color })} />
                        <IconPicker value={editData.icon} onChange={(icon) => setEditData({ ...editData, icon })} />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs uppercase text-muted-foreground font-semibold">{t('settings.badge_editor.geometry')}</Label>
                      <div className="grid grid-cols-2 gap-2">
                        <Select
                          value={editData.variant}
                          onValueChange={(v: BadgeVariant) => setEditData({ ...editData, variant: v })}
                        >
                          <SelectTrigger className="h-9">
                            <SelectValue placeholder={t('settings.badge_editor.variant')} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="solid">{t('settings.badge_editor.variants.solid')}</SelectItem>
                            <SelectItem value="soft">{t('settings.badge_editor.variants.soft')}</SelectItem>
                            <SelectItem value="outline">{t('settings.badge_editor.variants.outline')}</SelectItem>
                            <SelectItem value="ghost">{t('settings.badge_editor.variants.ghost')}</SelectItem>
                          </SelectContent>
                        </Select>
                        <Select
                          value={editData.size}
                          onValueChange={(v: BadgeSize) => setEditData({ ...editData, size: v })}
                        >
                          <SelectTrigger className="h-9">
                            <SelectValue placeholder={t('settings.badge_editor.size')} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="xs">{t('settings.badge_editor.sizes.xs')}</SelectItem>
                            <SelectItem value="sm">{t('settings.badge_editor.sizes.sm')}</SelectItem>
                            <SelectItem value="md">{t('settings.badge_editor.sizes.md')}</SelectItem>
                            <SelectItem value="lg">{t('settings.badge_editor.sizes.lg')}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <Select
                        value={editData.shape}
                        onValueChange={(v: BadgeShape) => setEditData({ ...editData, shape: v })}
                      >
                        <SelectTrigger className="h-9">
                          <SelectValue placeholder={t('settings.badge_editor.shape')} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="square">{t('settings.badge_editor.shapes.square')}</SelectItem>
                          <SelectItem value="rounded">{t('settings.badge_editor.shapes.rounded')}</SelectItem>
                          <SelectItem value="pill">{t('settings.badge_editor.shapes.pill')}</SelectItem>
                          <SelectItem value="bubble">{t('settings.badge_editor.shapes.bubble')}</SelectItem>
                          <SelectItem value="stadium">{t('settings.badge_editor.shapes.stadium')}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs uppercase text-muted-foreground font-semibold">{t('settings.badge_editor.effects')}</Label>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="flex items-center justify-between gap-2 border rounded-md px-2 py-1 h-9">
                          <span className="text-[10px] font-medium">{t('settings.badge_editor.glass')}</span>
                          <Switch checked={editData.isGlass} onCheckedChange={(v) => setEditData({ ...editData, isGlass: v })} />
                        </div>
                        <div className="flex items-center justify-between gap-2 border rounded-md px-2 py-1 h-9">
                          <span className="text-[10px] font-medium">{t('settings.badge_editor.anim')}</span>
                          <Switch checked={editData.isAnimated} onCheckedChange={(v) => setEditData({ ...editData, isAnimated: v })} />
                        </div>
                        <div className="flex items-center justify-between gap-2 border rounded-md px-2 py-1 h-9">
                          <span className="text-[10px] font-medium">{t('settings.badge_editor.grad')}</span>
                          <Switch checked={editData.isGradient} onCheckedChange={(v) => setEditData({ ...editData, isGradient: v })} />
                        </div>
                        {editData.isGradient && (
                          <ColorPicker value={editData.secondaryColor || editData.color} onChange={(color) => setEditData({ ...editData, secondaryColor: color })} />
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t">
                    <div className="flex items-center gap-4">
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] text-muted-foreground">{t('settings.badge_editor.preview')}:</span>
                        <Badge
                          id="preview"
                          name={editData.name || t('settings.badge_editor.preview_default_name')}
                          color={editData.color}
                          variant={editData.variant}
                          size={editData.size}
                          shape={editData.shape}
                          icon={editData.icon}
                          isGlass={editData.isGlass}
                          isGradient={editData.isGradient}
                          secondaryColor={editData.secondaryColor}
                          isAnimated={editData.isAnimated}
                        />
                      </div>
                    </div>
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
                    <Badge id={status.id} type="status" allowStyleEdit />
                    <div className="flex items-center gap-2">
                      {/* Индикаторы теперь внутри Badge или не требуются */}
                    </div>
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
                  <div className="flex items-center gap-2">
                    <ColorPicker value={newData.color} onChange={(color) => setNewData({ ...newData, color })} />
                    <IconPicker value={newData.icon} onChange={(icon) => setNewData({ ...newData, icon })} />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-semibold">{t('settings.badge_editor.geometry')}</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Select
                      value={newData.variant}
                      onValueChange={(v: BadgeVariant) => setNewData({ ...newData, variant: v })}
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="solid">{t('settings.badge_editor.variants.solid')}</SelectItem>
                        <SelectItem value="soft">{t('settings.badge_editor.variants.soft')}</SelectItem>
                        <SelectItem value="outline">{t('settings.badge_editor.variants.outline')}</SelectItem>
                        <SelectItem value="ghost">{t('settings.badge_editor.variants.ghost')}</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={newData.size} onValueChange={(v: BadgeSize) => setNewData({ ...newData, size: v })}>
                      <SelectTrigger className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="xs">{t('settings.badge_editor.sizes.xs')}</SelectItem>
                        <SelectItem value="sm">{t('settings.badge_editor.sizes.sm')}</SelectItem>
                        <SelectItem value="md">{t('settings.badge_editor.sizes.md')}</SelectItem>
                        <SelectItem value="lg">{t('settings.badge_editor.sizes.lg')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Select value={newData.shape} onValueChange={(v: BadgeShape) => setNewData({ ...newData, shape: v })}>
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="square">{t('settings.badge_editor.shapes.square')}</SelectItem>
                      <SelectItem value="rounded">{t('settings.badge_editor.shapes.rounded')}</SelectItem>
                      <SelectItem value="pill">{t('settings.badge_editor.shapes.pill')}</SelectItem>
                      <SelectItem value="bubble">{t('settings.badge_editor.shapes.bubble')}</SelectItem>
                      <SelectItem value="stadium">{t('settings.badge_editor.shapes.stadium')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-semibold">{t('settings.badge_editor.effects')}</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex items-center justify-between border rounded px-2 h-9">
                      <span className="text-[10px]">{t('settings.badge_editor.glass')}</span>
                      <Switch checked={newData.isGlass} onCheckedChange={(v) => setNewData({ ...newData, isGlass: v })} />
                    </div>
                    <div className="flex items-center justify-between border rounded px-2 h-9">
                      <span className="text-[10px]">{t('settings.badge_editor.anim')}</span>
                      <Switch checked={newData.isAnimated} onCheckedChange={(v) => setNewData({ ...newData, isAnimated: v })} />
                    </div>
                    <div className="flex items-center justify-between border rounded px-2 h-9">
                      <span className="text-[10px]">{t('settings.badge_editor.grad')}</span>
                      <Switch checked={newData.isGradient} onCheckedChange={(v) => setNewData({ ...newData, isGradient: v })} />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-primary/10">
                <Badge
                  id="preview-new"
                  name={newData.name || t('settings.badge_editor.preview_default_name')}
                  color={newData.color}
                  variant={newData.variant}
                  size={newData.size}
                  shape={newData.shape}
                  icon={newData.icon}
                  isGlass={newData.isGlass}
                  isGradient={newData.isGradient}
                  secondaryColor={newData.secondaryColor}
                  isAnimated={newData.isAnimated}
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
            {t('settings.statuses.no_statuses')}
          </p>
        )}
      </div>
    </div>
  );
}
