import React from 'react';
import { useTranslation } from '@/lib/i18n';
import { usePriceLists, useSetPriceListItem, usePriceListItems } from '@/modules/price_lists/hooks';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Save } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useState, useEffect } from 'react';

interface ServicePricesTabProps {
  serviceId: number | undefined;
}

export function ServicePricesTab({ serviceId }: ServicePricesTabProps) {
  const { t } = useTranslation();
  const { data: priceLists, isLoading: isLoadingLists } = usePriceLists();
  const setPriceMutation = useSetPriceListItem();
  
  // Local state for prices to allow editing before saving
  const [localPrices, setLocalPrices] = useState<Record<number, string>>({});

  // Fetch prices for all lists for this specific service
  // In a real app we might fetch all items for a service via a different endpoint, 
  // but here we can just map over price lists if we had a batch endpoint.
  // For simplicity, we will fetch the item's prices across lists if there was an endpoint,
  // or we can just fetch all items for the active price list.
  // Actually, we need to fetch price_list_items for each price list where item_id = serviceId.
  // To avoid multiple requests, an endpoint `GET /api/services/:id/prices` would be ideal.
  // But using the existing `usePriceListItems(priceListId, 'service')` works if we only have a few lists.
  
  // For UI mockup:
  const handlePriceChange = (listId: number, value: string) => {
    setLocalPrices(prev => ({ ...prev, [listId]: value }));
  };

  const handleSavePrice = async (listId: number) => {
    if (!serviceId) return;
    const priceStr = localPrices[listId];
    if (!priceStr) return;
    
    await setPriceMutation.mutateAsync({
      priceListId: listId,
      data: {
        itemType: 'service',
        itemId: serviceId,
        price: parseFloat(priceStr),
        currency: 'RUB' // Or take from price list
      }
    });
  };

  if (!serviceId) {
    return (
      <div className="p-4 text-center text-muted-foreground border border-dashed rounded-md mt-4">
        {t('services.prices.save_service_first')} {/* Сначала сохраните услугу, чтобы настроить цены. */}
      </div>
    );
  }

  if (isLoadingLists) return <div>{t('common.loading')}</div>;

  return (
    <div className="space-y-4 pt-4 animate-in fade-in-50">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('price_lists.title')} {/* Прайс-лист */}</TableHead>
              <TableHead className="w-[150px]">{t('common.currency')} {/* Валюта */}</TableHead>
              <TableHead className="w-[200px]">{t('common.price')} {/* Цена */}</TableHead>
              <TableHead className="w-[100px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {priceLists?.map(pl => (
              <TableRow key={pl.id}>
                <TableCell>
                  <div className="font-medium">{pl.name}</div>
                  {pl.isDefault && <Badge variant="outline" className="mt-1">По умолчанию</Badge>}
                </TableCell>
                <TableCell>{pl.currency}</TableCell>
                <TableCell>
                  <Input 
                    type="number" 
                    value={localPrices[pl.id] || ''} 
                    onChange={e => handlePriceChange(pl.id, e.target.value)} 
                    placeholder="0.00"
                  />
                </TableCell>
                <TableCell>
                  <Button size="icon" variant="ghost" onClick={() => handleSavePrice(pl.id)}>
                    <Save className="h-4 w-4 text-primary" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {priceLists?.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-4 text-muted-foreground">
                  {t('price_lists.no_data')} {/* Нет прайс-листов */}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
