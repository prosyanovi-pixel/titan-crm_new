import { useTranslation } from "@/lib/i18n";
import { BulkEditDialog } from "@/components/shared/BulkEditDialog";
import { useSettings } from "@/hooks/use-settings";
import { useUpdateProductBulk, useProductCategories } from "../hooks";

interface ProductBulkEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  count: number;
  selectedIds: number[];
  onSuccess?: () => void;
}

export function ProductBulkEditDialog({
  open,
  onOpenChange,
  count,
  selectedIds,
  onSuccess
}: ProductBulkEditDialogProps) {
  const { t } = useTranslation();
  const { getStatusesByModule, getTagsByModule } = useSettings();
  const updateBulk = useUpdateProductBulk();
  const { data: categories = [] } = useProductCategories();

  const statuses = getStatusesByModule('products');
  const tags = getTagsByModule('products');

  const referenceData = {
    statuses: statuses.map(s => ({ id: String(s.id), name: s.name })),
    tags: tags.map(t => ({ id: String(t.id), name: t.name, color: t.color })),
    productCategories: categories.map(c => ({ id: String(c.id), name: c.name }))
  };

  const handleConfirm = (field: string, value: any) => {
    // For tags, value might be an array
    const updates = { [field]: value };
    updateBulk.mutate({ ids: selectedIds, updates }, {
      onSuccess: () => {
        if (onSuccess) onSuccess();
        onOpenChange(false);
      }
    });
  };

  return (
    <BulkEditDialog
      open={open}
      onOpenChange={onOpenChange}
      onConfirm={handleConfirm}
      count={count}
      moduleId="products"
      title={t('products.bulk_edit_title')}
      description={t('common.bulk_edit_desc')}
      referenceData={referenceData}
    />
  );
}
