import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from '@/lib/i18n';
import { warehouseApi } from '@/modules/warehouse/api/warehouseApi';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2 } from 'lucide-react';

interface ProductBalancesTabProps {
  productId?: number;
}

export function ProductBalancesTab({ productId }: ProductBalancesTabProps) {
  const { t } = useTranslation();

  const { data: balances, isLoading } = useQuery({
    queryKey: ['product_balances', productId],
    queryFn: () => warehouseApi.getProductBalance(productId!),
    enabled: !!productId,
  });

  if (!productId) {
    return (
      <div className="text-center p-8 border border-dashed rounded-md text-muted-foreground text-sm mt-4">
        {t('warehouse.balances.save_product_first')} {/* Сначала сохраните товар, чтобы увидеть остатки */}
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!balances || balances.length === 0) {
    return (
      <div className="text-center p-8 border border-dashed rounded-md text-muted-foreground text-sm mt-4">
        {t('warehouse.balances.no_data')} {/* Нет данных об остатках для этого товара */}
      </div>
    );
  }

  return (
    <div className="mt-4 border rounded-md">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t('warehouse.columns.balances.warehouseName')}</TableHead>
            <TableHead className="text-right">{t('warehouse.columns.balances.quantity')}</TableHead>
            <TableHead className="text-right">{t('warehouse.columns.balances.reservedQuantity')}</TableHead>
            <TableHead className="text-right">{t('warehouse.columns.balances.available')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {balances.map((balance) => {
            const available = Number(balance.quantity) - Number(balance.reservedQuantity);
            return (
              <TableRow key={balance.id}>
                <TableCell className="font-medium">{balance.warehouseName}</TableCell>
                <TableCell className="text-right">{balance.quantity}</TableCell>
                <TableCell className="text-right text-orange-500">{balance.reservedQuantity}</TableCell>
                <TableCell className="text-right text-green-600 font-bold">{available}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
