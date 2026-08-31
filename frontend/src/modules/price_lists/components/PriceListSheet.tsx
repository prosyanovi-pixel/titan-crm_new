import { useState } from 'react';
import { useTranslation } from '@/lib/i18n';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ResizableSheet } from '@/components/shared';
import { PriceList } from '../types';
import { PriceListEditDialog } from './PriceListEditDialog';
import { Package, Briefcase, FileSpreadsheet, Edit2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PriceListSheetProps {
  priceList: PriceList | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PriceListSheet({ priceList, open, onOpenChange }: PriceListSheetProps) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('products');
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  if (!priceList) return null;

  const headerTitle = (
      <div className="flex items-center gap-2 max-w-full overflow-hidden mr-8">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
            <FileSpreadsheet className="w-4 h-4 text-primary" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-bold truncate flex-shrink-1 min-w-0" title={priceList.name}>
              {priceList.name}
            </span>
            <span className="text-[10px] text-muted-foreground opacity-70">
              {t('common.currency')}: {priceList.currency}
            </span>
          </div>
        </div>
        <Button variant="ghost" size="icon" className="w-8 h-8 shrink-0 rounded-full ml-1" onClick={() => setEditDialogOpen(true)}>
          <Edit2 className="w-4 h-4" />
        </Button>
      </div>
  );

  return (
    <ResizableSheet
      open={open}
      onOpenChange={onOpenChange}
      title={headerTitle}
      moduleKey="price-list-sheet"
      defaultWidth="xl"
    >
      <div className="space-y-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full justify-start overflow-x-auto">
            <TabsTrigger value="products" className="gap-1.5 text-xs">
              <Package className="w-3.5 h-3.5" />
              {t('price_lists.tabs.products')}
            </TabsTrigger>
            <TabsTrigger value="services" className="gap-1.5 text-xs">
              <Briefcase className="w-3.5 h-3.5" />
              {t('price_lists.tabs.services')}
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {activeTab === 'products' && (
          <PriceListItemsTab priceList={priceList} itemType="product" />
        )}
        
        {activeTab === 'services' && (
          <PriceListItemsTab priceList={priceList} itemType="service" />
        )}
      </div>

      <PriceListEditDialog 
        priceList={priceList} 
        open={editDialogOpen} 
        onOpenChange={setEditDialogOpen} 
      />
    </ResizableSheet>
  );
}
