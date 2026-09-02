import React, { useMemo } from 'react';
import { useTranslation } from '@/lib/i18n';
import { Input } from '@/components/ui/input';
import { EntityCombobox } from '@/components/shared/EntityCombobox';
import { useProducts } from '@/modules/products/hooks';
import { useServices } from '@/modules/services/hooks';

interface QuoteItemNameCellProps {
  itemType: 'product' | 'service' | 'custom';
  itemId?: number | null;
  name: string;
  onItemSelect: (id: number | null, name: string, price?: number) => void;
  onNameChange: (name: string) => void;
}

export function QuoteItemNameCell({ itemType, itemId, name, onItemSelect, onNameChange }: QuoteItemNameCellProps) {
  const { t } = useTranslation();
  
  // Always call both hooks, React Query will cache and deduplicate
  const { data: productsData } = useProducts({ limit: 1000 });
  const { data: servicesData } = useServices({ limit: 1000 });
  
  const options = useMemo(() => {
    const pData = Array.isArray(productsData) ? productsData : productsData?.data;
    const sData = Array.isArray(servicesData) ? servicesData : servicesData?.data;

    if (itemType === 'product' && pData) {
      return pData.map((p: any) => ({
        id: p.id,
        label: p.name,
        // Depending on exactly how price is named in product table
        price: p.price || p.purchasePrice || p.basePrice || 0
      }));
    }
    if (itemType === 'service' && sData) {
      return sData.map((s: any) => ({
        id: s.id,
        label: s.name,
        price: s.baseCost || s.price || 0
      }));
    }
    return [];
  }, [itemType, productsData, servicesData]);

  if (itemType === 'custom') {
    return (
      <Input 
        className="h-9" 
        value={name}
        onChange={(e) => onNameChange(e.target.value)}
        placeholder={t('quotes.item_name_placeholder')} 
      />
    );
  }

  return (
    <EntityCombobox
      value={itemId}
      options={options}
      placeholder={t('quotes.item_name_placeholder')}
      onChange={(id) => {
        if (!id) {
          onItemSelect(null, '');
          return;
        }
        const selected = options.find(o => String(o.id) === String(id));
        if (selected) {
          onItemSelect(Number(id), selected.label, selected.price);
        } else {
          onItemSelect(null, '');
        }
      }}
    />
  );
}
