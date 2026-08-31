import { useTranslation } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { SortableTabsList } from '@/components/shared';
import { DataTable } from '@/components/ui/data-table';
import { usePageSettings } from '@/context/LayoutContext';
import { useConfirm } from '@/components/ui/confirm-dialog';
import { useBulkActions } from "@/modules/registry/hooks/useBulkActions";
import { useQuotesPage } from '../hooks/useQuotesPage';
import { QuoteTableRow, QuoteBulkStatusMenu } from '../components';

/**
 * Страница списка КП.
 * Табы по статусам, поиск, сортировка, массовые операции, настройка колонок.
 */
export function QuotesPage() {
  const { t } = useTranslation();
  const { confirm } = useConfirm();
  const {
    quotes,
    totalCount,
    isLoading,
    table,
    activeTab,
    setActiveTab,
    tabCounts,
    columnLabels,
    handleRowQuickAction,
    handleBulkStatus,
    handleBulkDelete,
    navigate,
  } = useQuotesPage();

  const bulkActionsList = useBulkActions("quotes");
  const hasBulkDelete = bulkActionsList.some(a => a.id === "bulk_delete");
  const hasBulkEdit = bulkActionsList.some(a => a.id === "bulk_edit");

  usePageSettings({
    title: t('quotes.title'),
    subtitle: t('quotes.subtitle'),
    actions: (
      <Button className="gap-2 h-9" onClick={() => navigate('/quotes/new')}>
        <Plus className="w-4 h-4" />
        <span className="hidden sm:inline">{t('quotes.create')}</span>
      </Button>
    ),
  });

  /** Подтверждение массового удаления перед выполнением. */
  const confirmBulkDelete = async () => {
    if (await confirm({
      title: t('quotes.bulk.delete_confirm'),
      description: t('quotes.bulk.delete_confirm_description'),
    })) {
      await handleBulkDelete();
    }
  };

  return (
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
          data={quotes}
          columnLabels={columnLabels}
          totalCount={totalCount}
          virtualized
          searchPlaceholder={t('quotes.search_placeholder')}
          isLoading={isLoading}
          bulkActions={
            hasBulkEdit ? <QuoteBulkStatusMenu onSelectStatus={handleBulkStatus} /> : null
          }
          onBulkDelete={hasBulkDelete ? confirmBulkDelete : undefined}
          renderRow={(quote) => (
            <QuoteTableRow
              key={quote.id}
              quote={quote}
              selectedIds={table.selectedIds}
              visibleColumns={table.visibleColumns}
              columnOrder={table.columnOrder}
              onToggleSelection={table.toggleSelection}
              onRowClick={(q) => navigate(`/quotes/${q.id}`)}
              onQuickAction={handleRowQuickAction}
            />
          )}
        />
      </TabsContent>
    </Tabs>
  );
}
