import React from 'react';
import { InventoryTransaction } from '../../api/warehouseApi';
import { TableRow, TableCell } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from '@/lib/i18n';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

interface TransactionTableRowProps {
  transaction: InventoryTransaction;
  isSelected: boolean;
  visibleColumns: Record<string, boolean>;
  columnOrder: string[];
  onToggleSelection: (id: number) => void;
}

export function TransactionTableRow({
  transaction,
  isSelected,
  visibleColumns,
  columnOrder,
  onToggleSelection,
}: TransactionTableRowProps) {
  const { t } = useTranslation();

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'receipt': return <Badge className="bg-blue-500 hover:bg-blue-600">{t('warehouse.transaction.receipt')}</Badge>;
      case 'expense': return <Badge className="bg-orange-500 hover:bg-orange-600">{t('warehouse.transaction.shipment')}</Badge>;
      case 'transfer': return <Badge className="bg-purple-500 hover:bg-purple-600">{t('warehouse.transaction.transfer')}</Badge>;
      case 'adjustment': return <Badge className="bg-gray-500 hover:bg-gray-600">{t('warehouse.transaction.adjustment')}</Badge>;
      case 'reserve': return <Badge className="bg-yellow-500 hover:bg-yellow-600">{t('warehouse.transaction.reserve')}</Badge>;
      case 'unreserve': return <Badge className="bg-green-500 hover:bg-green-600">{t('warehouse.transaction.unreserve')}</Badge>;
      default: return <Badge variant="outline">{type}</Badge>;
    }
  };

  return (
    <TableRow data-state={isSelected ? 'selected' : undefined}>
      <TableCell className="w-10">
        <Checkbox
          checked={isSelected}
          onCheckedChange={() => onToggleSelection(transaction.id)}
        />
      </TableCell>
      {columnOrder.filter(key => visibleColumns[key]).map((key) => {
        switch (key) {
          case 'createdAt':
            return (
              <TableCell key={key} className="font-medium text-sm">
                {format(new Date(transaction.createdAt || Date.now()), 'dd MMM yyyy, HH:mm', { locale: ru })}
              </TableCell>
            );
          case 'type':
            return <TableCell key={key}>{getTypeBadge(transaction.type)}</TableCell>;
          case 'productName':
            return <TableCell key={key} className="font-medium">{transaction.productName}</TableCell>;
          case 'warehouseName':
            return <TableCell key={key}>{transaction.warehouseName}</TableCell>;
          case 'quantity':
            return (
              <TableCell key={key} className="text-right font-bold">
                {transaction.type === 'receipt' ? '+' : transaction.type === 'expense' ? '-' : ''}{transaction.quantity}
              </TableCell>
            );
          default:
            return <TableCell key={key}>-</TableCell>;
        }
      })}
    </TableRow>
  );
}
