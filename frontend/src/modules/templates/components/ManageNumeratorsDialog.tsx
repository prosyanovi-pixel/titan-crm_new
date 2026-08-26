import React, { useState } from 'react';
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Settings, Trash2, Edit2, Plus, Save, X } from 'lucide-react';
import { templatesApi } from '../api';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { useConfirm } from '@/components/ui/confirm-dialog';

interface Numerator {
  id: number;
  name: string;
  mask: string;
}

interface ManageNumeratorsDialogProps {
  numerators: Numerator[];
  onNumeratorsChange: (newNumerators: Numerator[]) => void;
}

export function ManageNumeratorsDialog({ numerators, onNumeratorsChange }: ManageNumeratorsDialogProps) {
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [editMask, setEditMask] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const { confirm } = useConfirm();

  const handleEdit = (n: Numerator) => {
    setEditingId(n.id);
    setEditName(n.name);
    setEditMask(n.mask);
    setIsAdding(false);
  };

  const handleDelete = async (id: number) => {
    const ok = await confirm({ description: 'Удалить нумератор?' });
    if (!ok) return;
    try {
      await templatesApi.deleteNumerator(id);
      onNumeratorsChange(numerators.filter(n => n.id !== id));
      toast.success('Нумератор удален');
    } catch (e) {
      toast.error('Ошибка при удалении нумератора');
    }
  };

  const handleSave = async (id: number) => {
    try {
      const updated = await templatesApi.updateNumerator(id, { name: editName, mask: editMask });
      onNumeratorsChange(numerators.map(n => n.id === id ? updated : n));
      setEditingId(null);
      toast.success('Нумератор обновлен');
    } catch (e) {
      toast.error('Ошибка при обновлении');
    }
  };

  const handleCreate = async () => {
    try {
      const created = await templatesApi.createNumerator({ name: editName, mask: editMask });
      onNumeratorsChange([...numerators, created]);
      setIsAdding(false);
      setEditName('');
      setEditMask('');
      toast.success('Нумератор создан');
    } catch (e) {
      toast.error('Ошибка при создании');
    }
  };

  const startAdd = () => {
    setIsAdding(true);
    setEditingId(null);
    setEditName('');
    setEditMask('DOC-{n}');
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="h-6 px-2">
          <Settings className="w-4 h-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Управление автонумераторами</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 mt-4">
          {numerators.length === 0 && !isAdding && (
            <p className="text-sm text-muted-foreground text-center py-4">Нет созданных нумераторов</p>
          )}

          {numerators.map(n => (
            <div key={n.id} className="flex items-center gap-2 border p-2 rounded-md bg-muted/20">
              {editingId === n.id ? (
                <div className="flex-1 grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-muted-foreground">Название</label>
                    <Input size={1} className="h-8 text-sm" value={editName} onChange={e => setEditName(e.target.value)} />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Формат (Маска)</label>
                    <Input size={1} className="h-8 text-sm" value={editMask} onChange={e => setEditMask(e.target.value)} />
                  </div>
                </div>
              ) : (
                <div className="flex-1 overflow-hidden">
                  <div className="font-medium text-sm truncate">{n.name}</div>
                  <div className="text-xs text-muted-foreground truncate font-mono">{n.mask}</div>
                </div>
              )}

              <div className="flex items-center gap-1 shrink-0 self-end">
                {editingId === n.id ? (
                  <>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-green-600" onClick={() => handleSave(n.id)}>
                      <Save className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditingId(null)}>
                      <X className="w-4 h-4" />
                    </Button>
                  </>
                ) : (
                  <>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600" onClick={() => handleEdit(n)}>
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600" onClick={() => handleDelete(n.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </>
                )}
              </div>
            </div>
          ))}

          {isAdding && (
             <div className="flex items-center gap-2 border p-2 rounded-md bg-muted/20 border-primary/50">
               <div className="flex-1 grid grid-cols-2 gap-2">
                 <div>
                   <label className="text-xs text-primary font-medium">Новое название</label>
                   <Input size={1} className="h-8 text-sm" autoFocus value={editName} onChange={e => setEditName(e.target.value)} placeholder="Например: Счета" />
                 </div>
                 <div>
                   <label className="text-xs text-primary font-medium">Новый формат</label>
                   <Input size={1} className="h-8 text-sm" value={editMask} onChange={e => setEditMask(e.target.value)} placeholder="СЧЕТ-{n}/{yyyy}" />
                 </div>
               </div>
               <div className="flex items-center gap-1 shrink-0 self-end">
                 <Button variant="ghost" size="icon" className="h-8 w-8 text-green-600" onClick={handleCreate} disabled={!editName || !editMask}>
                   <Save className="w-4 h-4" />
                 </Button>
                 <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setIsAdding(false)}>
                   <X className="w-4 h-4" />
                 </Button>
               </div>
             </div>
          )}

          {!isAdding && (
            <Button variant="outline" className="w-full text-xs" onClick={startAdd}>
              <Plus className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Добавить нумератор</span>
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
