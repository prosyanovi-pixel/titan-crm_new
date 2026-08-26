import { DataTableToolbar } from "@/components/shared";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenuLabel } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/i18n";
import { TabConfig } from "@/hooks/useDataTable";
import { Wrench, Plus } from "lucide-react";

interface ServicesToolbarProps {
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
  onAddService?: () => void;
  bulkActions?: React.ReactNode;
  className?: string;
}

export function ServicesToolbar({
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
  onAddService,
  bulkActions,
  className,
}: ServicesToolbarProps) {
  const { t } = useTranslation();

  const columnLabels = {
    name: t('services.table.headers.name'),
    category: t('services.table.headers.category'),
    type: t('services.table.headers.type'),
    base_cost: t('services.table.headers.base_cost'),
    status: t('services.table.headers.status'),
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

  return (
    <DataTableToolbar
      searchQuery={searchQuery}
      onSearchChange={onSearchChange}
      selectedCount={selectedCount}
      onCancelSelection={onCancelSelection}
      onBulkDelete={onBulkDelete}
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
