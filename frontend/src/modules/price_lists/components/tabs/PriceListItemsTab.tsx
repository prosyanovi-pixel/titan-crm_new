import React, { useState, useEffect } from 'react';
import { useTranslation } from '@/lib/i18n';
import { useProducts } from '@/modules/products/hooks';
import { useServices } from '@/modules/services/hooks';
import { usePriceListItems } from '../../hooks';
import { PriceList } from '../../types';
import { Input } from '@/components/ui/input';
import { Search, Loader2 } from 'lucide-react';

interface PriceListItemsTabProps {
  priceList: PriceList;
  itemType: 'product' | 'service';
  editedPrices: Record<number, string>;
  onEditedPricesChange: React.Dispatch<React.SetStateAction<Record<number, string>>>;
}

export function PriceListItemsTab({ priceList, itemType, editedPrices, onEditedPricesChange }: PriceListItemsTabProps) {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');

  const { data: productsData, isLoading: loadingProducts } = useProducts(
    itemType === 'product' ? { limit: 1000, search } : {}
  );
  const { data: servicesData, isLoading: loadingServices } = useServices(
    itemType === 'service' ? { limit: 1000, search } : {}
  );
  
  const { data: priceListItems = [], isLoading: loadingItems } = usePriceListItems(priceList.id, itemType);

  const loading = (itemType === 'product' ? loadingProducts : loadingServices) || loadingItems;
  
  const itemsList = itemType === 'product' 
    ? (Array.isArray(productsData) ? productsData : (productsData as any)?.data || [])
    : (Array.isArray(servicesData) ? servicesData : (servicesData as any)?.data || []);

  const groupedItems = itemsList.reduce((acc: Record<string, any[]>, item: any) => {
    const category = item.categoryName || item.category_name || t('common.uncategorized');
    if (!acc[category]) acc[category] = [];
    acc[category].push(item);
    return acc;
  }, {});

  const handlePriceChange = (itemId: number, priceStr: string) => {
    const currentItem = priceListItems.find(i => i.itemId === itemId);
    const originalPriceStr = currentItem ? String(currentItem.price) : '';
    
    onEditedPricesChange(prev => {
      const next = { ...prev };
      if (priceStr === originalPriceStr) {
        delete next[itemId];
      } else {
        next[itemId] = priceStr;
      }
      return next;
    });
  };

  return (
    <div className="space-y-4 pt-4 px-2">
      <div className="flex items-center justify-between gap-2">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t('common.search')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      <div className="rounded-md border">
        {loading ? (
          <div className="flex items-center justify-center p-8 text-muted-foreground">
            <Loader2 className="w-6 h-6 animate-spin mr-2" />
            {t('common.loading')}
          </div>
        ) : itemsList.length === 0 ? (
          <div className="text-center p-8 text-muted-foreground">
            {t('common.no_data')}
          </div>
        ) : (
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 border-b">
              <tr>
                <th className="px-4 py-3 font-medium">{t('common.name')}</th>
                <th className="px-4 py-3 font-medium w-48">{t('price_lists.price')} ({priceList.currency})</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(groupedItems).map(([category, items]: [string, any[]]) => (
                <React.Fragment key={category}>
                  <tr className="bg-muted/40">
                    <td colSpan={2} className="px-4 py-2 text-xs font-semibold uppercase text-muted-foreground tracking-wider">
                      {category}
                    </td>
                  </tr>
                  {items.map((item: any) => {
                    const currentItem = priceListItems.find(i => i.itemId === item.id);
                    const currentPrice = currentItem ? currentItem.price : '';

                    return (
                      <tr key={item.id} className="border-b hover:bg-muted/30">
                        <td className="px-4 py-3 font-medium">
                          {item.name}
                          {item.sku_internal && (
                            <span className="ml-2 text-xs text-muted-foreground">
                              {item.sku_internal}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-2">
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={editedPrices[item.id] !== undefined ? editedPrices[item.id] : currentPrice}
                            onChange={(e) => handlePriceChange(item.id, e.target.value)}
                            placeholder="0.00"
                            className="h-8 w-32"
                          />
                        </td>
                      </tr>
                    );
                  })}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
