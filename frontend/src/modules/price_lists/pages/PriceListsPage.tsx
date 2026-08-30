import { useState } from 'react';
import { useTranslation } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { SortableTabsList } from '@/components/shared';
import { DataTable } from '@/components/ui/data-table';
import { usePageSettings } from '@/context/LayoutContext';
import { useConfirm } from '@/components/ui/confirm-dialog';
import { useCreatePriceList } from '../hooks';
import { usePriceListsPage } from '../hooks/usePriceListsPage';
import { PriceListTableRow, PriceListBulkMenu } from '../components';
import { Plus, Loader2 } from 'lucide-react';

/**
 * Страница прайс-листов.
 * Табы по активности, поиск, сортировка, массовые операции, настройка колонок.
 */
export function PriceListsPage() {
  const { t } = useTranslation();
  const { confirm } = useConfirm();
  const createPriceList = useCreatePriceList();
  const {
    priceLists,
    totalCount,
    isLoading,
    table,
    activeTab,
    setActiveTab,
    tabCounts,
    columnLabels,
    handleRowQuickAction,
    handleBulkActivate,
    handleBulkDeactivate,
    handleBulkMakeDefault,
    handleBulkDelete,
  } = usePriceListsPage();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [name, setName] = useState('');
  const [currency, setCurrency] = useState('RUB');

  /** Создание прайс-листа из диалога. */
  const handleCreate = async () => {
    if (!name.trim()) return;
    try {
      await createPriceList.mutateAsync({
        name: name.trim(),
        currency: currency.trim().toUpperCase() || 'RUB',
        isActive: true,
        isDefault: false,
      });
      setName('');
      setCurrency('RUB');
      setDialogOpen(false);
    } catch {
      // Ошибка уже показана тостом в хуке useCreatePriceList
    }
  };

  usePageSettings({
    title: t('price_lists.title'),
    subtitle: t('price_lists.subtitle'),
    actions: (
      <Button className="gap-2 h-9" onClick={() => setDialogOpen(true)}>
        <Plus className="w-4 h-4" />
        <span className="hidden sm:inline">{t('price_lists.add_button') /* Создать прайс-лист */}</span>
      </Button>
    ),
  });

  /** Подтверждение массового удаления перед выполнением. */
  const confirmBulkDelete = async () => {
    if (await confirm({
      title: t('price_lists.bulk.delete_confirm'),
      description: t('price_lists.bulk.delete_confirm_description'),
    })) {
      await handleBulkDelete();
    }
  };

  return (
    <>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
        <div className="flex flex-nowrap justify-between items-center gap-4 overflow-x-auto overflow-y-hidden w-full mb-4 pb-1">
          <SortableTabsList
            tabsConfig={table.tabsConfig}
            onReorder={table.reorderTab}
            t={t}
            className="h-10 sm:h-11 gap-1 p-1 bg-muted/50 rounded-xl flex-shrink-0 flex-nowrap w-max"
            triggerClassName="flex-none gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg font-medium px-3 sm:px-4 whitespace-nowrap"
            renderBadge={(tabId) => {
              const count = tabCounts[tabId];
              if (count === undefined) return null;
              return (
                <span className="ml-1 text-[10px] font-semibold rounded-full bg-primary/10 data-[state=active]:bg-primary-foreground/20 px-1.5 py-0.5">
                  {count}
                </span>
              );
            }}
          />
        </div>

        <TabsContent value={activeTab} className="mt-0 flex-1 min-h-0">
          <DataTable
            table={table}
            data={priceLists}
            columnLabels={columnLabels}
            totalCount={totalCount}
            virtualized
            searchPlaceholder={t('price_lists.search_placeholder')}
            isLoading={isLoading}
            bulkActions={
              <PriceListBulkMenu
                onActivate={handleBulkActivate}
                onDeactivate={handleBulkDeactivate}
                onMakeDefault={handleBulkMakeDefault}
              />
            }
            onBulkDelete={confirmBulkDelete}
            renderRow={(pl) => (
              <PriceListTableRow
                key={pl.id}
                priceList={pl}
                selectedIds={table.selectedIds}
                visibleColumns={table.visibleColumns}
                columnOrder={table.columnOrder}
                onToggleSelection={table.toggleSelection}
                onRowClick={(item) => {
                  // Просмотр прайс-листа пока не реализован; при желании добавить роут.
                  void item;
                }}
                onQuickAction={handleRowQuickAction}
              />
            )}
          />
        </TabsContent>
      </Tabs>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('price_lists.create_title') /* Новый прайс-лист */}</DialogTitle>
            <DialogDescription>
              {t('price_lists.create_description') /* Заполните основные параметры прайс-листа */}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="pl-name">{t('common.name') /* Название */}</Label>
              <Input
                id="pl-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t('price_lists.name_placeholder') /* Название прайс-листа... */}
                autoFocus
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="pl-currency">{t('common.currency') /* Валюта */}</Label>
              <Input
                id="pl-currency"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                placeholder={t('price_lists.currency_placeholder') /* RUB */}
                defaultValue="RUB"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              {t('common.cancel') /* Отмена */}
            </Button>
            <Button onClick={handleCreate} disabled={!name.trim() || createPriceList.isPending}>
              {createPriceList.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              {t('common.create') /* Создать */}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
