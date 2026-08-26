import { DataTableToolbar } from "@/components/shared";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useTranslation } from "@/lib/i18n";
import { TabConfig } from "@/hooks/useDataTable";
import { Users, Plus } from "lucide-react";

interface ContractorToolbarProps {
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
  relationshipTypes?: { id: string; name: string }[];
  legalForms?: { id: string; name: string }[];
  tags?: { id: string; name: string }[];
  // Bulk selection props
  isAllSelected?: boolean;
  isSomeSelected?: boolean;
  toggleAllPages?: () => void;
  // Actions
  onBulkEditClick?: () => void;
  onAddContractor?: () => void;
  hideArchived?: boolean;
  onHideArchivedChange?: (v: boolean) => void;
  className?: string;
}

export function ContractorToolbar({
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
  onBulkEditClick,
  onAddContractor,
  hideArchived,
  onHideArchivedChange,
  className,
}: ContractorToolbarProps) {
  const { t } = useTranslation();

  const columnLabels = {
    name: t('contractor_sheet.field.name'),
    tags: t('contractor_sheet.field.tags'),
    type: t('contractor_sheet.field.type'),
    status: t('contractor_sheet.field.status'),
    phone: t('contractor_sheet.field.phone'),
    manager: t('contractor_sheet.field.manager'),
  };

  const FilterContent = (
    <div className="p-2 space-y-4">
      <div className="flex items-center space-x-2 px-2 py-1">
        <Checkbox 
          id="hide-archived-contractors" 
          checked={hideArchived} 
          onCheckedChange={(checked) => onHideArchivedChange?.(checked as boolean)}
        />
        <Label htmlFor="hide-archived-contractors" className="text-sm font-medium leading-none cursor-pointer">
          {t('contractors.filters.hide_archived')}
        </Label>
      </div>

      <DropdownMenuSeparator />
      <DropdownMenuLabel>{t('common.status')}</DropdownMenuLabel>
      <Select value={statusFilter} onValueChange={onStatusFilterChange}>
        <SelectTrigger className="h-8 mb-2 mx-2 w-auto">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t('contractors.filters.all_statuses')}</SelectItem>
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
          {onBulkEditClick && (
            <Button
              variant="outline"
              size="sm"
              onClick={onBulkEditClick}
              disabled={selectedCount === 0}
            >
              <Users className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">{t('contractors.bulk_actions.title')}</span>
            </Button>
          )}
          {onAddContractor && (
            <Button
              variant="default"
              size="sm"
              onClick={onAddContractor}
            >
              <Plus className="w-4 h-4 mr-2" />
              {t('contractors.add_button')}
            </Button>
          )}
        </div>
      }
      className={className}
    />
  );
}
