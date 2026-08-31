import { useState, useEffect } from 'react';
import { useTranslation } from '@/lib/i18n';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ResizableSheet } from '@/components/shared';
import { PriceList } from '../types';
import { PriceListItemsTab } from './tabs/PriceListItemsTab';
import { PriceListOverviewTab } from './tabs/PriceListOverviewTab';
import { Package, Briefcase, FileSpreadsheet, Download, CircleDot } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useBulkSetPriceListItems, useUpdatePriceList } from '../hooks';
import { toast } from 'sonner';

interface PriceListSheetProps {
  priceList: PriceList | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PriceListSheet({ priceList, open, onOpenChange }: PriceListSheetProps) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('overview');
  const bulkSetPriceListItems = useBulkSetPriceListItems();
  const updatePriceList = useUpdatePriceList();

  const [editedProductPrices, setEditedProductPrices] = useState<Record<number, string>>({});
  const [editedServicePrices, setEditedServicePrices] = useState<Record<number, string>>({});
  const [editedOverview, setEditedOverview] = useState<Partial<PriceList>>({});

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setEditedProductPrices({});
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setEditedServicePrices({});
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setEditedOverview({});
  }, [priceList?.id]);

  if (!priceList) return null;

  const hasChanges = Object.keys(editedProductPrices).length > 0 || Object.keys(editedServicePrices).length > 0 || Object.keys(editedOverview).length > 0;

  const handleDownloadPdf = () => {
    window.open(`/api/price-lists/${priceList.id}/pdf`, '_blank');
  };

  const handleSave = async () => {
    const productsToSave = Object.keys(editedProductPrices).map(itemIdStr => {
      const priceStr = editedProductPrices[Number(itemIdStr)];
      const price = priceStr && priceStr.trim() !== '' ? parseFloat(priceStr) : null;
      return { itemType: 'product' as const, itemId: parseInt(itemIdStr, 10), price, currency: priceList.currency };
    });

    const servicesToSave = Object.keys(editedServicePrices).map(itemIdStr => {
      const priceStr = editedServicePrices[Number(itemIdStr)];
      const price = priceStr && priceStr.trim() !== '' ? parseFloat(priceStr) : null;
      return { itemType: 'service' as const, itemId: parseInt(itemIdStr, 10), price, currency: priceList.currency };
    });

    const itemsToSave = [...productsToSave, ...servicesToSave];

    try {
      const promises: Promise<any>[] = [];
      
      if (itemsToSave.length > 0) {
        promises.push(bulkSetPriceListItems.mutateAsync({
          priceListId: priceList.id,
          items: itemsToSave
        }));
      }
      
      if (Object.keys(editedOverview).length > 0) {
        promises.push(updatePriceList.mutateAsync({
          id: priceList.id,
          data: editedOverview
        }));
      }
      
      if (promises.length > 0) {
        await Promise.all(promises);
      }
      
      setEditedProductPrices({});
      setEditedServicePrices({});
      setEditedOverview({});
      toast.success(t('common.saved_successfully'));
    } catch {
      toast.error(t('common.error'));
    }
  };

  const handleCancel = () => {
    setEditedProductPrices({});
    setEditedServicePrices({});
    setEditedOverview({});
  };

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
        <div className="flex items-center">
          <Button variant="ghost" size="icon" className="w-8 h-8 shrink-0 rounded-full text-muted-foreground hover:text-primary" onClick={handleDownloadPdf}>
            <Download className="w-4 h-4" />
          </Button>
        </div>
      </div>
  );

  return (
    <ResizableSheet
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen && hasChanges) {
          if (confirm(t('common.discard_changes_dialog.description'))) {
            handleCancel();
            onOpenChange(false);
          }
        } else {
          onOpenChange(isOpen);
        }
      }}
      title={headerTitle}
      moduleKey="price-list-sheet"
      defaultWidth="xl"
      onSave={handleSave}
      saveDisabled={!hasChanges || bulkSetPriceListItems.isPending || updatePriceList.isPending}
      hasUnsavedChanges={hasChanges}
      onShowDiscardDialog={() => {
        if (confirm(t('common.discard_changes_dialog.description'))) {
          handleCancel();
          onOpenChange(false);
        }
      }}
    >
      <div className="space-y-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full justify-start overflow-x-auto">
            <TabsTrigger value="overview" className="gap-1.5 text-xs">
              <CircleDot className="w-3.5 h-3.5" />
              {t('common.basic_info')}
            </TabsTrigger>
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

        {activeTab === 'overview' && (
          <PriceListOverviewTab 
            formData={{ ...priceList, ...editedOverview }}
            onChange={(field, value) => setEditedOverview(prev => ({ ...prev, [field]: value }))}
          />
        )}

        {activeTab === 'products' && (
          <PriceListItemsTab 
            priceList={priceList} 
            itemType="product" 
            editedPrices={editedProductPrices}
            onEditedPricesChange={setEditedProductPrices}
          />
        )}
        
        {activeTab === 'services' && (
          <PriceListItemsTab 
            priceList={priceList} 
            itemType="service" 
            editedPrices={editedServicePrices}
            onEditedPricesChange={setEditedServicePrices}
          />
        )}
      </div>
    </ResizableSheet>
  );
}
