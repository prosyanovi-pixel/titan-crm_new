import { useTranslation } from "@/lib/i18n";
import { BulkEditDialog } from "@/components/shared/BulkEditDialog";
import { useSettings } from "@/hooks/use-settings";
import { useUpdateWarehouseBulk } from "../hooks";

interface WarehouseBulkEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  count: number;
  selectedIds: number[];
  onSuccess?: () => void;
}

export function WarehouseBulkEditDialog({
  open,
  onOpenChange,
  count,
  selectedIds,
  onSuccess
}: WarehouseBulkEditDialogProps) {
  const { t } = useTranslation();
  const { getStatusesByModule, getTagsByModule } = useSettings();
  const updateBulk = useUpdateWarehouseBulk();

  const statuses = getStatusesByModule('warehouse');
  const tags = getTagsByModule('warehouse');

  const referenceData = {
    statuses: statuses.map(s => ({ id: String(s.id), name: s.name })),
    tags: tags.map(t => ({ id: String(t.id), name: t.name, color: t.color }))
  };

  const handleConfirm = (field: string, value: any) => {
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
      moduleId="warehouse"
      title={t('warehouse.bulk_edit_title')}
      description={t('common.bulk_edit_desc')}
      referenceData={referenceData}
    />
  );
}
