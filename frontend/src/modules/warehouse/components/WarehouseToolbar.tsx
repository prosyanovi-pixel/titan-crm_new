import { DataTableToolbar } from "@/components/shared";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useTranslation } from "@/lib/i18n";
import { TabConfig } from "@/hooks/useDataTable";
import { Button } from "@/components/ui/button";
import { useBulkActions } from "@/modules/registry/hooks/useBulkActions";

interface WarehouseToolbarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedCount: number;
  onCancelSelection: () => void;
  onBulkDelete: () => void;
  tabsConfig: TabConfig[];
  onMoveTab: (index: number, direction: 'up' | 'down') => void;
  onToggleTab: (id: string) => void;
  visibleColumns: Record<string, boolean>;
  onToggleColumn: (id: string) => void;
  columnOrder?: string[];
  onMoveColumn?: (key: string, direction: 'up' | 'down') => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  statuses: { id: string; name: string }[];
  bulkActions?: React.ReactNode;
  className?: string;
  columnLabels?: Record<string, string>;
}

export function WarehouseToolbar({
  searchQuery,
  onSearchChange,
  selectedCount,
  onCancelSelection,
  onBulkDelete,
  tabsConfig,
  onMoveTab,
  onToggleTab,
  visibleColumns,
  onToggleColumn,
  columnOrder,
  onMoveColumn,
  statusFilter,
  onStatusFilterChange,
  statuses,
  bulkActions,
  className,
  columnLabels,
}: WarehouseToolbarProps) {
  const { t } = useTranslation();

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

  const bulkActionsList = useBulkActions("warehouse");
  const hasBulkDelete = bulkActionsList.some(a => a.id === "bulk_delete");

  return (
    <DataTableToolbar
      searchQuery={searchQuery}
      onSearchChange={onSearchChange}
      selectedCount={selectedCount}
      onCancelSelection={onCancelSelection}
      onBulkDelete={hasBulkDelete ? onBulkDelete : undefined}
      bulkActions={bulkActions}
      tabsConfig={tabsConfig}
      onMoveTab={onMoveTab}
      onToggleTab={(id, visible) => onToggleTab(id)}
      visibleColumns={visibleColumns}
      onToggleColumn={(id, visible) => onToggleColumn(id)}
      columnOrder={columnOrder}
      onMoveColumn={onMoveColumn}
      columnLabels={columnLabels}
      className={className}
      filters={FilterContent}
    />
  );
}
