import React from 'react';
import { useTranslation } from '@/lib/i18n';
import { InventoryTransaction } from '../api/warehouseApi';
import { useDataTable } from '@/hooks/useDataTable';
import { TableSkeleton } from '@/components/shared/skeletons';
import { DataTable } from '@/components/ui/data-table';
import { TransactionTableRow } from './rows/TransactionTableRow';

interface TransactionsListProps {
  transactionsTable: ReturnType<typeof useDataTable<InventoryTransaction>>;
  filteredTransactions: InventoryTransaction[];
  transactionsLoading: boolean;
}

export const TransactionsList = ({ transactionsTable, filteredTransactions, transactionsLoading }: TransactionsListProps) => {
  const { t } = useTranslation();

  const columnLabels = {
    createdAt: 'warehouse.columns.transactions.createdAt',
    type: 'warehouse.columns.transactions.type',
    productName: 'warehouse.columns.transactions.productName',
    warehouseName: 'warehouse.columns.transactions.warehouseName',
    quantity: 'warehouse.columns.transactions.quantity',
  };

  if (transactionsLoading) {
    return <TableSkeleton rowCount={5} columnCount={5} showToolbar={false} />;
  }

  return (
    <div className="flex-1 overflow-hidden h-full">
      <DataTable<InventoryTransaction>
        table={transactionsTable}
        data={filteredTransactions}
        columnLabels={columnLabels}
        totalCount={filteredTransactions.length}
        virtualized={true}
        hideToolbar={true}
        renderRow={(item, index) => (
          <TransactionTableRow
            key={item.id}
            transaction={item}
            isSelected={transactionsTable.selectedIds.has(item.id)}
            visibleColumns={transactionsTable.visibleColumns}
            columnOrder={transactionsTable.columnOrder}
            onToggleSelection={(id) => transactionsTable.toggleSelection(id)}
          />
        )}
      />
    </div>
  );
};
