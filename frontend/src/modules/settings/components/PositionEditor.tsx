import { useTranslation } from '@/lib/i18n';
import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Plus, Trash2, Pencil, Check, X, GripVertical } from 'lucide-react';
import { api } from '@/lib/api';

interface Position {
  id: number;
  name: string;
  description: string;
  displayorder: number;
  is_active: boolean;
}

const EMPTY = { name: '', description: '', displayorder: 0 };

export function PositionEditor() {
  const { t } = useTranslation();
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editData, setEditData] = useState<Partial<Position>>({});
  const [isAdding, setIsAdding] = useState(false);
  const [newItem, setNewItem] = useState(EMPTY);

  const load = useCallback(async () => {
    try {
      const data = await api.get('/org/positions');
      setPositions(data);
    } catch {
      toast.error(t('generated.oshibka_zagruzki_dolzhnostey'));
    } finally {
      setLoading(false);
    }
  }, []);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load(); }, [load]);

  const handleEdit = (p: Position) => { setEditingId(p.id); setEditData({ ...p }); };

  const handleSaveEdit = async () => {
    if (!editData.name?.trim() || editingId === null) return;
    try {
      const res = await api.put(`/org/positions/${editingId}`, editData);
      setPositions(prev => prev.map(p => p.id === editingId ? res : p));
      setEditingId(null);
      toast.success(t('generated.dolzhnost_obnovlena'));
    } catch (e: any) { toast.error(e?.message || t('settings.validation.error')); }
  };

  const handleAdd = async () => {
    if (!newItem.name.trim()) { toast.error(t('generated.nazvanie_obyazatel_no')); return; }
    try {
      const res = await api.post('/org/positions', newItem);
      setPositions(prev => [...prev, res]);
      setNewItem(EMPTY);
      setIsAdding(false);
      toast.success(t('generated.dolzhnost_dobavlena'));
    } catch (e: any) { toast.error(e?.message || t('settings.validation.error')); }
  };

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/org/positions/${id}`);
      setPositions(prev => prev.filter(p => p.id !== id));
      toast.success(t('generated.dolzhnost_udalena'));
    } catch (e: any) { toast.error(e?.message || t('settings.validation.in_use_employees')); }
  };

  if (loading) return <div className="py-8 text-center text-muted-foreground">{t('generated.zagruzka')}</div>;

  return (
    <div className="space-y-2">
      {positions.map(p => (
        <div key={p.id} className="flex items-center gap-2 px-3 py-2 rounded-md border hover:bg-muted/30 group">
          <GripVertical className="h-4 w-4 text-muted-foreground/40 shrink-0" />

          {editingId === p.id ? (
            <>
              <Input className="h-7 text-sm flex-1" value={editData.name ?? ''} autoFocus
                onChange={e => setEditData(prev => ({ ...prev, name: e.target.value }))}
                onKeyDown={e => { if (e.key === 'Enter') handleSaveEdit(); if (e.key === 'Escape') setEditingId(null); }}
              />
              <Input className="h-7 text-sm flex-1" value={editData.description ?? ''} placeholder={t('generated.opisanie_neobyazatel_no')}
                onChange={e => setEditData(prev => ({ ...prev, description: e.target.value }))} />
              <div className="flex items-center gap-1.5 shrink-0">
                <Switch
                  id={`pos-active-${editingId}`}
                  checked={editData.is_active ?? true}
                  onCheckedChange={v => setEditData(prev => ({ ...prev, is_active: v }))}
                />
                <Label htmlFor={`pos-active-${editingId}`} className="text-xs cursor-pointer">
                  {editData.is_active !== false ? t('settings.positions.status_active') : t('settings.positions.status_inactive')}
                </Label>
              </div>
              <Button size="icon" variant="ghost" className="h-7 w-7" onClick={handleSaveEdit}><Check className="h-3.5 w-3.5" /></Button>
              <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setEditingId(null)}><X className="h-3.5 w-3.5" /></Button>
            </>
          ) : (
            <>
              <div className="flex-1 min-w-0">
                <span className="text-sm font-medium">{p.name}</span>
                {p.description && <span className="text-xs text-muted-foreground ml-2">{p.description}</span>}
              </div>
              {p.is_active === false && <Badge variant="secondary" className="text-[10px] h-4 px-1">{t('generated.neaktivna')}</Badge>}
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleEdit(p)}><Pencil className="h-3.5 w-3.5" /></Button>
                <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => handleDelete(p.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
              </div>
            </>
          )}
        </div>
      ))}

      {isAdding && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-md border-2 border-dashed border-primary/40">
          <GripVertical className="h-4 w-4 text-muted-foreground/40 shrink-0" />
          <Input className="h-7 text-sm flex-1" placeholder={t('generated.nazvanie_dolzhnosti')} value={newItem.name} autoFocus
            onChange={e => setNewItem(p => ({ ...p, name: e.target.value }))}
            onKeyDown={e => { if (e.key === 'Enter') handleAdd(); if (e.key === 'Escape') { setIsAdding(false); setNewItem(EMPTY); } }}
          />
          <Input className="h-7 text-sm flex-1" placeholder={t('generated.opisanie_neobyazatel_no')} value={newItem.description}
            onChange={e => setNewItem(p => ({ ...p, description: e.target.value }))} />
          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={handleAdd}><Check className="h-3.5 w-3.5" /></Button>
          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => { setIsAdding(false); setNewItem(EMPTY); }}><X className="h-3.5 w-3.5" /></Button>
        </div>
      )}

      {!isAdding && (
        <Button variant="outline" className="w-full" size="sm" onClick={() => setIsAdding(true)}>
          <Plus className="h-4 w-4 mr-2" /> {t('generated.dobavit_dolzhnost')}
        </Button>
      )}
    </div>
  );
}
