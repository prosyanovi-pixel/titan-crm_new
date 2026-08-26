import { useTranslation } from '@/lib/i18n';
import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Plus, Trash2, Pencil, ChevronRight } from 'lucide-react';
import { api } from '@/lib/api';

interface Department {
  id: number;
  name: string;
  description: string;
  parent_id: number | null;
  parent_name?: string;
  head_employee_id: number | null;
  head_name?: string;
  displayorder: number;
  is_active: boolean;
}

const EMPTY_FORM = { name: '', description: '', parent_id: null as number | null, displayorder: 0, is_active: true };

export function DepartmentEditor() {
  const { t } = useTranslation();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<typeof EMPTY_FORM>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await api.get('/org/departments');
      setDepartments(data);
    } catch {
      toast.error(t('generated.oshibka_zagruzki_otdelov'));
    } finally {
      setLoading(false);
    }
  }, []);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load(); }, [load]);

  const openAdd = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  };

  const openEdit = (d: Department) => {
    setEditingId(d.id);
    setForm({ name: d.name, description: d.description || '', parent_id: d.parent_id, displayorder: d.displayorder, is_active: d.is_active });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error(t('generated.nazvanie_obyazatel_no')); return; }
    setSaving(true);
    try {
      if (editingId) {
        const res = await api.put(`/org/departments/${editingId}`, form);
        setDepartments(prev => prev.map(d => d.id === editingId ? res : d));
      } else {
        const res = await api.post('/org/departments', form);
        setDepartments(prev => [...prev, res]);
      }
      setDialogOpen(false);
      toast.success(editingId ? t('generated.otdel_obnovlen') : t('generated.otdel_dobavlen'));
    } catch (e: any) {
      toast.error(e?.message || t('settings.validation.in_use_employees'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/org/departments/${id}`);
      setDepartments(prev => prev.filter(d => d.id !== id));
      toast.success(t('generated.otdel_udalen'));
    } catch (e: any) {
      toast.error(e?.message || t('settings.validation.in_use_employees'));
    }
  };

  // Строим дерево: сначала корневые, потом дочерние (1 уровень)
  const rootDepts = departments.filter(d => !d.parent_id);
  const childrenOf = (id: number) => departments.filter(d => d.parent_id === id);

  if (loading) return <div className="py-8 text-center text-muted-foreground">{t('generated.zagruzka')}</div>;

  return (
    <div className="space-y-2">
      {rootDepts.map(d => (
        <div key={d.id}>
          <DeptRow dept={d} onEdit={openEdit} onDelete={handleDelete} indent={0} />
          {childrenOf(d.id).map(child => (
            <DeptRow key={child.id} dept={child} onEdit={openEdit} onDelete={handleDelete} indent={1} />
          ))}
        </div>
      ))}

      <Button variant="outline" className="w-full" size="sm" onClick={openAdd}>
        <Plus className="h-4 w-4 mr-2" /> {t('generated.dobavit_otdel')}
      </Button>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingId ? t('settings.departments.edit_department') : t('settings.departments.new_department')}</DialogTitle>
            <DialogDescription>
              {editingId ? t('general.generated.izmenite_informatsiyu_ob_otdele') : t('general.generated.sozdayte_novyy_otdel_v_organizatsionnoy_strukture')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label>{t('generated.nazvanie')}</Label>
              <Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                placeholder={t('generated.otdel_prodazh')} autoFocus />
            </div>
            <div className="space-y-1.5">
              <Label>{t('generated.opisanie')}</Label>
              <Input value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                placeholder={t('generated.neobyazatel_no')} />
            </div>
            <div className="space-y-1.5">
              <Label>{t('generated.roditel_skiy_otdel')}</Label>
              <Select
                value={form.parent_id?.toString() ?? 'none'}
                onValueChange={v => setForm(p => ({ ...p, parent_id: v === 'none' ? null : parseInt(v) }))}
              >
                <SelectTrigger><SelectValue placeholder={t('generated.net_kornevoy')} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">{t('generated.net_kornevoy')}</SelectItem>
                  {departments
                    .filter(d => d.id !== editingId)
                    .map(d => <SelectItem key={d.id} value={d.id.toString()}>{d.name}</SelectItem>)
                  }
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-3 pt-1">
              <Switch
                id="dept-is-active"
                checked={form.is_active}
                onCheckedChange={v => setForm(p => ({ ...p, is_active: v }))}
              />
              <Label htmlFor="dept-is-active" className="cursor-pointer">
                {form.is_active ? t('settings.departments.status_active') : t('settings.departments.status_inactive')}
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>{t('common.cancel')}</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? t('generated.sohranenie') : t('common.save')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function DeptRow({
  dept, onEdit, onDelete, indent,
}: {
  dept: Department;
  onEdit: (d: Department) => void;
  onDelete: (id: number) => void;
  indent: number;
}) {
  const { t } = useTranslation();
  return (
    <div
      className="flex items-center gap-2 px-3 py-2 rounded-md border hover:bg-muted/30 group"
      style={{ marginLeft: indent * 24 }}
    >
      {indent > 0 && <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/60 shrink-0" />}
      <div className="flex-1 min-w-0">
        <span className="text-sm font-medium">{dept.name}</span>
        {dept.description && <span className="text-xs text-muted-foreground ml-2">{dept.description}</span>}
        {dept.head_name && (
          <span className="text-xs text-muted-foreground ml-2">· {t('settings.departments.head_prefix')} {dept.head_name}</span>
        )}
      </div>
      {dept.is_active === false && <Badge variant="secondary" className="text-[10px] h-4 px-1">{t('generated.neaktiven')}</Badge>}
      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => onEdit(dept)}><Pencil className="h-3.5 w-3.5" /></Button>
        <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => onDelete(dept.id)}>
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
