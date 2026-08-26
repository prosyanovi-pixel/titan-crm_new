import React, { useMemo, useCallback } from 'react';
import { useTranslation } from "@/lib/i18n";
import { BulkEditDialog } from "@/components/shared/BulkEditDialog";
import { useSettings } from "@/hooks/use-settings";
import { useUpdateServiceBulk, useServiceCategoriesTree } from "../hooks";

interface ServiceBulkEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  count: number;
  selectedIds: number[];
  onSuccess?: () => void;
}

export function ServiceBulkEditDialog({
  open,
  onOpenChange,
  count,
  selectedIds,
  onSuccess
}: ServiceBulkEditDialogProps) {
  const { t } = useTranslation();
  const { getStatusesByModule, getTagsByModule } = useSettings();
  const updateBulk = useUpdateServiceBulk();
  const { data: categories = [] } = useServiceCategoriesTree();

  const statuses = getStatusesByModule('services');
  const tags = getTagsByModule('services');

  // Flatten the tree for the combobox/select if needed, but for now we just pass them as flat or let it render
  const flatCategories = useMemo(() => {
    const flatten = (cats: Array<{ id: number | string; name: string; children?: any[] }>): Array<{ id: string; name: string }> => {
      let result: Array<{ id: string; name: string }> = [];
      for (const c of cats) {
        result.push({ id: String(c.id), name: c.name });
        if (c.children && c.children.length > 0) {
          result = result.concat(flatten(c.children));
        }
      }
      return result;
    };
    return flatten(categories);
  }, [categories]);

  const referenceData = useMemo(() => ({
    statuses: statuses.map(s => ({ id: String(s.id), name: s.name })),
    tags: tags.map(t => ({ id: String(t.id), name: t.name, color: t.color })),
    serviceCategories: flatCategories
  }), [statuses, tags, flatCategories]);

  const handleConfirm = useCallback((field: string, value: unknown) => {
    const updates = { [field]: value };
    updateBulk.mutate({ ids: selectedIds, updates }, {
      onSuccess: () => {
        if (onSuccess) onSuccess();
        onOpenChange(false);
      }
    });
  }, [updateBulk, selectedIds, onOpenChange, onSuccess]);

  return (
    <BulkEditDialog
      open={open}
      onOpenChange={onOpenChange}
      onConfirm={handleConfirm}
      count={count}
      moduleId="services"
      title={t('services.bulk_edit_title')}
      description={t('common.bulk_edit_desc')}
      referenceData={referenceData}
    />
  );
}
