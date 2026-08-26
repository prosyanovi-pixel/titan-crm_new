import React from 'react';
import { useTranslation } from '@/lib/i18n';
import { Warehouse } from '../api/warehouseApi';
import { useDataTable } from '@/hooks/useDataTable';
import { TableSkeleton } from '@/components/shared/skeletons';
import { DataTable } from '@/components/ui/data-table';
import { WarehouseTableRow } from './rows/WarehouseTableRow';

interface WarehousesListProps {
  warehousesTable: ReturnType<typeof useDataTable<Warehouse>>;
  filteredWarehouses: Warehouse[];
  warehousesLoading: boolean;
  handleWarehouseQuickAction: (action: string, id: number | string) => Promise<void>;
}

export const WarehousesList = ({ warehousesTable, filteredWarehouses, warehousesLoading, handleWarehouseQuickAction }: WarehousesListProps) => {
  const { t } = useTranslation();

  const columnLabels = {
    name: 'common.name',
    type: 'warehouse.columns.warehouses.type',
    address: 'warehouse.columns.warehouses.address',
    status: 'common.status',
    tags: 'common.tags',
  };

  if (warehousesLoading) {
    return <TableSkeleton rowCount={5} columnCount={5} showToolbar={false} />;
  }

  return (
    <div className="flex-1 overflow-hidden h-full">
      <DataTable<Warehouse>
        table={warehousesTable}
        data={filteredWarehouses}
        columnLabels={columnLabels}
        totalCount={filteredWarehouses.length}
        virtualized={true}
        hideToolbar={true}
        renderRow={(item, index) => (
          <WarehouseTableRow
            key={item.id}
            warehouse={item}
            isSelected={warehousesTable.selectedIds.has(item.id)}
            visibleColumns={warehousesTable.visibleColumns}
            columnOrder={warehousesTable.columnOrder}
            onToggleSelection={(id) => warehousesTable.toggleSelection(id)}
            onQuickAction={handleWarehouseQuickAction}
          />
        )}
      />
    </div>
  );
};
