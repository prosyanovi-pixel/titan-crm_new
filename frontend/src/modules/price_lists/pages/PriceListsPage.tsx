import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useTranslation } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { SortableTabsList } from '@/components/shared';
import { DataTable } from '@/components/ui/data-table';
import { usePageSettings } from '@/context/LayoutContext';
import { useConfirm } from '@/components/ui/confirm-dialog';
import { useCreatePriceList } from '../hooks';
import { usePriceListsPage } from '../hooks/usePriceListsPage';
import { PriceListTableRow, PriceListBulkMenu, PriceListSheet } from '../components';
import { useCurrencies } from '@/hooks/useCurrencies';
import { Plus, Loader2 } from 'lucide-react';
import { PriceList } from '../types';

const formSchema = z.object({
  name: z.string().min(1, { message: 'Обязательное поле' }),
  currency: z.string().min(1, { message: 'Обязательное поле' }),
});

type FormValues = z.infer<typeof formSchema>;

/**
 * Страница прайс-листов.
 * Табы по активности, поиск, сортировка, массовые операции, настройка колонок.
 */
export function PriceListsPage() {
  const { t } = useTranslation();
  const { confirm } = useConfirm();
  const createPriceList = useCreatePriceList();
  const { data: currencies = [] } = useCurrencies();
  
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
  const [selectedPriceList, setSelectedPriceList] = useState<PriceList | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      currency: 'RUB',
    },
  });

  /** Создание прайс-листа из диалога. */
  const onSubmit = async (values: FormValues) => {
    try {
      await createPriceList.mutateAsync({
        name: values.name.trim(),
        currency: values.currency,
        isActive: true,
        isDefault: false,
      });
      form.reset();
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
                onRowClick={(item) => setSelectedPriceList(item as PriceList)}
                onQuickAction={async (action, id) => {
                  if (action === 'view' || action === 'edit') {
                    const pl = priceLists.find(p => p.id === id);
                    if (pl) setSelectedPriceList(pl);
                  } else {
                    await handleRowQuickAction(action, id);
                  }
                }}
              />
            )}
          />
        </TabsContent>
      </Tabs>

      <Dialog open={dialogOpen} onOpenChange={(open) => {
        setDialogOpen(open);
        if (!open) form.reset();
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('price_lists.create_title') /* Новый прайс-лист */}</DialogTitle>
            <DialogDescription>
              {t('price_lists.create_description') /* Заполните основные параметры прайс-листа */}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 py-2">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('common.name') /* Название */}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t('price_lists.name_placeholder') /* Название прайс-листа... */}
                        autoFocus
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="currency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('common.currency') /* Валюта */}</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t('price_lists.currency_placeholder') /* RUB */} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {currencies.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.id} ({c.name})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter className="mt-4">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  {t('common.cancel') /* Отмена */}
                </Button>
                <Button type="submit" disabled={createPriceList.isPending}>
                  {createPriceList.isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                  {t('common.create') /* Создать */}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <PriceListSheet
        priceList={selectedPriceList}
        open={!!selectedPriceList}
        onOpenChange={(open) => {
          if (!open) setSelectedPriceList(null);
        }}
      />
    </>
  );
}
