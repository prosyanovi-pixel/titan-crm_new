import { DataTableToolbar } from "@/components/shared";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenuLabel } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/i18n";
import { TabConfig } from "@/hooks/useDataTable";
import { Box, Plus } from "lucide-react";
import { useBulkActions } from "@/modules/registry/hooks/useBulkActions";

interface ProductsToolbarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedCount: number;
  onCancelSelection: () => void;
  onBulkDelete: () => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  statuses: { id: string; name: string }[];
  tabsConfig: TabConfig[];
  onMoveTab: (index: number, direction: 'up' | 'down') => void;
  onToggleTab: (id: string) => void;
  visibleColumns: Record<string, boolean>;
  onToggleColumn: (key: string, visible: boolean) => void;
  columnOrder?: string[];
  onMoveColumn?: (key: string, direction: 'up' | 'down') => void;
  onAddProduct?: () => void;
  bulkActions?: React.ReactNode;
  className?: string;
}

export function ProductsToolbar({
  searchQuery,
  onSearchChange,
  selectedCount,
  onCancelSelection,
  onBulkDelete,
  statusFilter,
  onStatusFilterChange,
  statuses,
  tabsConfig,
  onMoveTab,
  onToggleTab,
  visibleColumns,
  onToggleColumn,
  columnOrder,
  onMoveColumn,
  onAddProduct,
  bulkActions,
  className,
}: ProductsToolbarProps) {
  const { t } = useTranslation();

  const columnLabels = {
    name: t('products.table.headers.name'),
    category: t('products.table.headers.category'),
    sku_internal: t('products.table.headers.sku_internal'),
    type: t('products.column_labels.type'),
    purchase_price: t('products.table.headers.purchase_price'),
    status: t('products.table.headers.status'),
    tags: t('common.tags'),
  };

  const FilterContent = (
    <div className="p-2 space-y-4">
      <DropdownMenuLabel>{t('common.status')}</DropdownMenuLabel>
      <Select value={statusFilter} onValueChange={onStatusFilterChange}>
        <SelectTrigger className="h-8 mb-2 mx-2 w-auto">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t('common.all')}</SelectItem>
          {statuses.map(status => (
            <SelectItem key={status.id} value={status.id}>
              {status.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );

  const bulkActionsList = useBulkActions("products");
  const hasBulkDelete = bulkActionsList.some(a => a.id === "bulk_delete");

  return (
    <DataTableToolbar
      searchQuery={searchQuery}
      onSearchChange={onSearchChange}
      selectedCount={selectedCount}
      onCancelSelection={onCancelSelection}
      onBulkDelete={hasBulkDelete ? onBulkDelete : undefined}
      tabsConfig={tabsConfig}
      onMoveTab={onMoveTab}
      onToggleTab={onToggleTab}
      visibleColumns={visibleColumns}
      onToggleColumn={onToggleColumn}
      columnLabels={columnLabels}
      columnOrder={columnOrder}
      onMoveColumn={onMoveColumn}
      filters={FilterContent}
      bulkActions={
        <div className="flex items-center gap-2">
          {bulkActions}
        </div>
      }
      className={className}
    />
  );
}
