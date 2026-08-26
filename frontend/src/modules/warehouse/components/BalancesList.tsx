import React from 'react';
import { useTranslation } from '@/lib/i18n';
import { InventoryBalance, Warehouse } from '../api/warehouseApi';
import { useDataTable } from '@/hooks/useDataTable';
import { TableSkeleton } from '@/components/shared/skeletons';
import { DataTable } from '@/components/ui/data-table';
import { BalancesTableRow } from './rows/BalancesTableRow';

interface BalancesListProps {
  balancesTable: ReturnType<typeof useDataTable<InventoryBalance>>;
  filteredBalances: InventoryBalance[];
  balancesLoading: boolean;
}

export const BalancesList = ({ balancesTable, filteredBalances, balancesLoading }: BalancesListProps) => {
  const { t } = useTranslation();

  const columnLabels = {
    skuInternal: 'warehouse.columns.balances.skuInternal',
    productName: 'warehouse.columns.balances.productName',
    warehouseName: 'warehouse.columns.balances.warehouseName',
    quantity: 'warehouse.columns.balances.quantity',
    reservedQuantity: 'warehouse.columns.balances.reservedQuantity',
    available: 'warehouse.columns.balances.available',
  };

  if (balancesLoading) {
    return <TableSkeleton rowCount={5} columnCount={6} showToolbar={false} />;
  }

  return (
    <div className="flex-1 overflow-hidden h-full">
      <DataTable<InventoryBalance>
        table={balancesTable}
        data={filteredBalances}
        columnLabels={columnLabels}
        totalCount={filteredBalances.length}
        virtualized={true}
        hideToolbar={true}
        renderRow={(item, index) => (
          <BalancesTableRow
            key={item.id}
            balance={item}
            isSelected={balancesTable.selectedIds.has(item.id)}
            visibleColumns={balancesTable.visibleColumns}
            columnOrder={balancesTable.columnOrder}
            onToggleSelection={(id) => balancesTable.toggleSelection(id)}
          />
        )}
      />
    </div>
  );
};
