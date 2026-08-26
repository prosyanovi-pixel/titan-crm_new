import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Plus, Trash2, Edit2, Move } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { useTranslation } from '@/lib/i18n';
import { useConfirm } from '@/components/ui/confirm-dialog';
import { api } from '@/lib/api';
import { ColorPicker } from '@/components/ui/ColorPicker';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/status-system';

interface StageItem {
  id: string;
  name: string;
  color?: string;
  variant?: string;
  displayorder?: number;
}

export function ProjectStageEditor() {
  const { t } = useTranslation();
  const { confirm } = useConfirm();
  const [items, setItems] = useState<StageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editColor, setEditColor] = useState('#6B7280');
  const [editVariant, setEditVariant] = useState<'solid'|'soft'|'outline'|'ghost'>('solid');
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState('#6B7280');
  const [newVariant, setNewVariant] = useState<'solid'|'soft'|'outline'|'ghost'>('solid');

  const dragIndex = useRef<number | null>(null);

  useEffect(() => {
    let mounted = true;
    api.get('/settings/project-stages')
      .then(res => {
        if (!mounted) return;
        const list = (res.items || []).map((r: Record<string, unknown>) => ({ id: r.id as string, name: r.name as string, color: (r.color as string) || '#6B7280', variant: (r.variant as string) || 'solid', displayorder: r.displayorder as number }));
        setItems(list);
      })
      .catch(console.error)
      .finally(() => mounted && setLoading(false));
    return () => { mounted = false };
  }, []);

  const persistOrder = useCallback(async (ordered: StageItem[]) => {
    const ids = ordered.map(i => i.id);
    await api.put('/settings/project-stages/reorder', { ids });
  }, []);

  const onDragStart = (e: React.DragEvent, index: number) => {
    dragIndex.current = index;
    e.dataTransfer.effectAllowed = 'move';
  };

  const onDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    const from = dragIndex.current;
    if (from === null || from === index) return;
    setItems(prev => {
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(index, 0, moved);
      dragIndex.current = index;
      return next;
    });
  };

  const onDragEnd = async () => {
    dragIndex.current = null;
    await persistOrder(items);
  };

  const handleAdd = async () => {
    if (!newName.trim()) return;
    const payload = { name: newName.trim(), color: newColor, variant: newVariant };
    const res = await api.post('/settings/project-stages', payload);
    setItems(prev => [...prev, { id: res.id, name: res.name, color: res.color || newColor, variant: res.variant || newVariant }]);
    setNewName('');
  };

  const startEdit = (it: StageItem) => {
    setEditingId(it.id);
    setEditName(it.name || '');
    setEditColor(it.color || '#6B7280');
    setEditVariant((it.variant || 'solid') as 'solid' | 'soft' | 'outline' | 'ghost');
  };

  const saveEdit = async () => {
    if (!editingId) return;
    const res = await api.put(`/settings/project-stages/${editingId}`, { name: editName, color: editColor, variant: editVariant });
    setItems(prev => prev.map(i => i.id === editingId ? { ...i, name: res.name, color: res.color || editColor, variant: res.variant || editVariant } : i));
    setEditingId(null);
  };

  const handleDelete = async (id: string) => {
    if (!(await confirm({ title: t('common.confirm_deletion'), description: t('common.confirm_deletion_text'), variant: 'destructive' }))) return;
    await api.delete(`/settings/project-stages/${id}`);
    setItems(prev => prev.filter(i => i.id !== id));
  };

  const handleSaveOrder = async () => {
    await persistOrder(items);
  };

  if (loading) return <div className="py-6 text-center text-muted-foreground">{t('common.loading')}</div>;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-2">
        <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder={t('settings.project_stages.new_placeholder')} />
        <div className="flex items-center gap-2">
          <ColorPicker value={newColor} onChange={(c) => setNewColor(c)} />
          <Select value={newVariant} onValueChange={(v) => setNewVariant(v as 'solid'|'soft'|'outline'|'ghost')}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="solid">{t('settings.badge_editor.variants.solid') || 'Solid'}</SelectItem>
              <SelectItem value="soft">{t('settings.badge_editor.variants.soft') || 'Soft'}</SelectItem>
              <SelectItem value="outline">{t('settings.badge_editor.variants.outline') || 'Outline'}</SelectItem>
              <SelectItem value="ghost">{t('settings.badge_editor.variants.ghost') || 'Ghost'}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={handleAdd}><Plus className="w-4 h-4 mr-1"/> {t('common.add')}</Button>
      </div>

      <div className="space-y-2">
        {items.map((it, idx) => (
          <Card key={it.id} className="overflow-hidden" draggable onDragStart={(e) => onDragStart(e, idx)} onDragOver={(e) => onDragOver(e, idx)} onDragEnd={onDragEnd}>
            <CardContent className="p-3 flex items-center justify-between">
              {editingId === it.id ? (
                <div className="flex gap-2 w-full">
                  <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
                  <ColorPicker value={editColor} onChange={(c) => setEditColor(c)} />
                  <Select value={editVariant} onValueChange={(v) => setEditVariant(v as 'solid'|'soft'|'outline'|'ghost')}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="solid">{t('settings.badge_editor.variants.solid') || 'Solid'}</SelectItem>
                      <SelectItem value="soft">{t('settings.badge_editor.variants.soft') || 'Soft'}</SelectItem>
                      <SelectItem value="outline">{t('settings.badge_editor.variants.outline') || 'Outline'}</SelectItem>
                      <SelectItem value="ghost">{t('settings.badge_editor.variants.ghost') || 'Ghost'}</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button onClick={saveEdit}>{t('common.save') || 'Save'}</Button>
                </div>
              ) : (
                <div className="flex items-center gap-4 w-full">
                  <div className="flex items-center gap-2">
                    <Badge id={it.id} name={it.name} color={it.color} variant={it.variant as 'solid'|'soft'|'outline'|'ghost'} />
                    <div className="font-medium">{it.name}</div>
                  </div>
                  <div className="text-xs text-muted-foreground">{it.id}</div>
                </div>
              )}

              <div className="flex items-center gap-2">
                {editingId !== it.id && <Button variant="ghost" onClick={() => startEdit(it)}><Edit2 /></Button>}
                <Button variant="ghost" onClick={() => handleDelete(it.id)}><Trash2 /></Button>
                <Button variant="ghost" onClick={handleSaveOrder}><Move /></Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
