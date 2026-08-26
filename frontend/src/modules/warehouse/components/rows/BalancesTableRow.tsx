import React from 'react';
import { InventoryBalance } from '../../api/warehouseApi';
import { TableRow, TableCell } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';

interface BalancesTableRowProps {
  balance: InventoryBalance;
  isSelected: boolean;
  visibleColumns: Record<string, boolean>;
  columnOrder: string[];
  onToggleSelection: (id: number) => void;
}

export function BalancesTableRow({
  balance,
  isSelected,
  visibleColumns,
  columnOrder,
  onToggleSelection,
}: BalancesTableRowProps) {
  const available = Number(balance.quantity) - Number(balance.reservedQuantity);

  return (
    <TableRow data-state={isSelected ? 'selected' : undefined}>
      <TableCell className="w-10">
        <Checkbox
          checked={isSelected}
          onCheckedChange={() => onToggleSelection(balance.id)}
        />
      </TableCell>
      {columnOrder.filter(key => visibleColumns[key]).map((key) => {
        switch (key) {
          case 'skuInternal':
            return <TableCell key={key} className="font-mono text-sm">{balance.skuInternal || '-'}</TableCell>;
          case 'productName':
            return <TableCell key={key} className="font-medium">{balance.productName}</TableCell>;
          case 'warehouseName':
            return <TableCell key={key}>{balance.warehouseName}</TableCell>;
          case 'quantity':
            return <TableCell key={key} className="text-right font-medium">{balance.quantity}</TableCell>;
          case 'reservedQuantity':
            return <TableCell key={key} className="text-right text-orange-500 font-medium">{balance.reservedQuantity}</TableCell>;
          case 'available':
            return <TableCell key={key} className="text-right text-green-600 font-bold">{available}</TableCell>;
          default:
            return <TableCell key={key}>-</TableCell>;
        }
      })}
    </TableRow>
  );
}
