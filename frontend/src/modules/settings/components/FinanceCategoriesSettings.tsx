import { useState } from 'react';
import { useTranslation } from '@/lib/i18n';
import {
  useCategories, useCreateCategory, useUpdateCategory, useDeleteCategory,
} from '@/modules/finance/hooks/useFinance';
import { ExpenseCategory } from '@/modules/finance/types/finance.types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

// ─────────── Category dialog ───────────
function CategoryDialog({
  category,
  onClose,
}: {
  category?: ExpenseCategory | null;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const createCat = useCreateCategory();
  const updateCat = useUpdateCategory();

  const isSystem = category?.isSystem || (category as any)?.is_system;

  const [name, setName] = useState(category?.name || '');
  const [kind, setKind] = useState<'income' | 'expense'>(category?.kind || 'expense');
  const [color, setColor] = useState(category?.color || '#6366F1');

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error(t('finance.dds.category_dialog.name_required'));
      return;
    }
    try {
      if (category?.id) {
        await updateCat.mutateAsync({ id: category.id, data: { name, kind, color } });
      } else {
        await createCat.mutateAsync({ name, kind, color });
      }
      onClose();
    } catch {
      // handled in hook
    }
  };

  const isPending = createCat.isPending || updateCat.isPending;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="bg-background rounded-lg shadow-xl w-full max-w-sm p-5 space-y-4">
        <h2 className="text-base font-semibold">
          {category ? t('finance.dds.category_dialog.title_edit') : t('finance.dds.category_dialog.title_new')}
        </h2>

        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium block mb-1">{t('finance.dds.category_dialog.name_label')} *</label>
            <input
              className="w-full border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder={t('finance.dds.category_dialog.name_placeholder')}
              autoFocus
            />
          </div>

          <div>
            <label className="text-sm font-medium block mb-1">{t('finance.dds.category_dialog.type_label')}</label>
            <div className="flex gap-2">
              <button
                className={`flex-1 py-2 px-3 rounded-md text-sm border transition-colors ${kind === 'income' ? 'bg-green-100 border-green-400 text-green-800 dark:bg-green-950 dark:text-green-300' : 'border-border hover:bg-muted'} ${isSystem ? 'opacity-50 cursor-not-allowed' : ''}`}
                onClick={() => setKind('income')}
                disabled={!!isSystem}
              >
                {t('finance.dds.category_dialog.kind_income')}
              </button>
              <button
                className={`flex-1 py-2 px-3 rounded-md text-sm border transition-colors ${kind === 'expense' ? 'bg-red-100 border-red-400 text-red-800 dark:bg-red-950 dark:text-red-300' : 'border-border hover:bg-muted'} ${isSystem ? 'opacity-50 cursor-not-allowed' : ''}`}
                onClick={() => setKind('expense')}
                disabled={!!isSystem}
              >
                {t('finance.dds.category_dialog.kind_expense')}
              </button>
            </div>
            {isSystem && (
              <p className="text-xs text-muted-foreground mt-1">{t('finance.dds.category_dialog.type_locked')}</p>
            )}
          </div>

          <div>
            <label className="text-sm font-medium block mb-1">{t('finance.dds.category_dialog.color_label')}</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={color}
                onChange={e => setColor(e.target.value)}
                className="w-10 h-8 rounded border cursor-pointer"
              />
              <span className="text-sm text-muted-foreground">{color}</span>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>{t('finance.dds.category_dialog.cancel')}</Button>
          <Button onClick={handleSave} disabled={isPending}>
            {isPending ? t('finance.dds.category_dialog.saving') : t('finance.dds.category_dialog.save')}
          </Button>
        </div>
      </div>
    </div>
  );
}

export function FinanceCategoriesSettings() {
  const { t } = useTranslation();
  const { data: categories, isLoading } = useCategories();
  const deleteCat = useDeleteCategory();
  const [editingCat, setEditingCat] = useState<ExpenseCategory | null | undefined>(undefined);

  const isAdmin = localStorage.getItem('titan_user_role') === 'admin';

  const handleDelete = async (cat: ExpenseCategory) => {
    const isSystem = cat.isSystem || (cat as any).is_system;
    if (isSystem) { toast.error(t('finance.dds.category_dialog.system_no_delete')); return; }
    if (!confirm(t('finance.dds.category_dialog.confirm_delete').replace('{name}', cat.name))) return;
    await deleteCat.mutateAsync(cat.id);
  };

  const income = (categories || []).filter(c => c.kind === 'income');
  const expense = (categories || []).filter(c => c.kind === 'expense');

  const renderList = (cats: ExpenseCategory[]) => cats.map(cat => {
    const isSystem = cat.isSystem || (cat as any).is_system;
    const canEdit = !isSystem || isAdmin;
    const canDelete = !isSystem;
    return (
      <div key={cat.id} className="group flex items-center gap-1 p-2 rounded-lg hover:bg-muted/40 border border-transparent hover:border-border transition-all">
        <span
          className="w-3 h-3 rounded-full shrink-0"
          style={{ backgroundColor: cat.color || '#94A3B8' }}
        />
        <span className="text-sm font-medium">{cat.name}</span>
        {isSystem && (
          <Badge variant="secondary" className="text-[10px] h-4 px-1 ml-1 uppercase">{t('generated.sistemnaya')}</Badge>
        )}
        <div className="flex items-center gap-1 ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
          {canEdit && (
            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setEditingCat(cat)}>
              <Pencil className="w-3.5 h-3.5" />
            </Button>
          )}
          {canDelete && (
            <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => handleDelete(cat)}>
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>
      </div>
    );
  });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div>
          <CardTitle className="text-base font-semibold">{t('finance.dds.categories')}</CardTitle>
          <CardDescription>{t('finance.subtitle')}</CardDescription>
        </div>
        <Button size="sm" className="h-8 gap-1.5" onClick={() => setEditingCat(null)}>
          <Plus className="w-3.5 h-3.5" />
          {t('finance.dds.add_category')}
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-10 w-full" />)}</div>
            <div className="space-y-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-10 w-full" />)}</div>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-green-600 uppercase tracking-widest pl-2">{t('generated.dohody')}</h4>
              <div className="space-y-1">{renderList(income)}</div>
              {income.length === 0 && <p className="text-sm text-muted-foreground pl-2 italic">{t('generated.net_dannyh')}</p>}
            </div>
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-red-600 uppercase tracking-widest pl-2">{t('generated.rashody')}</h4>
              <div className="space-y-1">{renderList(expense)}</div>
              {expense.length === 0 && <p className="text-sm text-muted-foreground pl-2 italic">{t('generated.net_dannyh')}</p>}
            </div>
          </div>
        )}

        {editingCat !== undefined && (
          <CategoryDialog
            category={editingCat}
            onClose={() => setEditingCat(undefined)}
          />
        )}
      </CardContent>
    </Card>
  );
}
