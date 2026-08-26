/**
 * Главная страница модуля Отчёты
 * Отображает сохранённые конфигурации: мои отчёты и общие
 */

import { useCallback, useMemo, useState } from 'react';
import { useNavigate }   from 'react-router-dom';
import { Plus, BarChart2, Users, Loader2, ChevronDown, Settings2, Trash2, Copy, Share2, Eye, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { Button }         from '@/components/ui/button';
import { Separator }      from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import { Badge } from '@/components/ui/status-system';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { getReportTypeMeta } from '../config/reportTypes';
import type { ReportConfig } from '../types/reports.types';
import {
  useReportConfigs,
  useDeleteReportConfig,
  useDuplicateReportConfig,
  useUpdateReportConfig,
} from '../hooks/useReportConfigs';
import { usePageSettings } from '@/context/LayoutContext';
import { useTranslation } from '@/lib/i18n';
import { DataTableToolbar, SortableTabsList } from '@/components/shared';
import { QuickActionsMenu } from '@/components/ui/QuickActionsMenu';
import { useDataTable } from '@/hooks/useDataTable';
import { SortableTableHead } from '@/components/shared/SortableTableHead';

/** Получить ID текущего пользователя из localStorage (единый ключ с api.ts) */
function getCurrentUserId(): string {
  // Use '2' as fallback to match api.ts standard for development
  return localStorage.getItem('titan_user_id') || '2';
}

const COLUMN_LABELS = {
  name: 'common.name',
  type: 'common.type',
  updatedAt: 'common.updatedAt',
  createdBy: 'common.owner',
  status: 'common.status',
  actions: 'common.actions',
};

/**
 * Главная страница отчётов
 */
export function ReportsPage() {
  const { t } = useTranslation();
  const navigate      = useNavigate();
  const currentUserId = getCurrentUserId();

  const { data: configs = [], isLoading } = useReportConfigs();
  const deleteConfig    = useDeleteReportConfig();
  const duplicateConfig = useDuplicateReportConfig();
  const updateConfig    = useUpdateReportConfig();

  const table = useDataTable({
    initialData: configs,
    initialColumns: {
      name: true,
      type: true,
      updatedAt: true,
      createdBy: true,
      status: true,
      actions: true,
    },
    initialTabs: [
      { id: 'my', label: 'reports.myReports', icon: BarChart2, visible: true },
      { id: 'shared', label: 'reports.sharedReports', icon: Users, visible: true },
    ],
    storageKey: 'reports-table',
  });

  const [activeTab, setActiveTab] = useState<'my' | 'shared'>('my');
  const activeTabConfig = table.tabsConfig.find(t => t.id === activeTab);
  const firstVisibleTab = useMemo(() => table.tabsConfig.find(t => t.visible), [table.tabsConfig]);
  const visibleActiveTab = activeTabConfig?.visible ? activeTab : (firstVisibleTab?.id as 'my' | 'shared' | undefined) ?? activeTab;

  // Robust filtering for my and shared configs
  const myConfigs = useMemo(() => {
    if (!Array.isArray(configs)) return [];
    return configs.filter(c => String(c.createdBy) === String(currentUserId));
  }, [configs, currentUserId]);

  const sharedConfigs = useMemo(() => {
    if (!Array.isArray(configs)) return [];
    // Вкладка "Общие" должна показывать все расшаренные отчёты,
    // включая те, которыми поделился сам пользователь (чтобы он видел, что они там есть).
    return configs.filter(c => c.isShared === true);
  }, [configs]);
  
  const filteredMyConfigs = useMemo(() => 
    myConfigs.filter(c => 
      c.name.toLowerCase().includes(table.searchQuery.toLowerCase()) ||
      (c.description && c.description.toLowerCase().includes(table.searchQuery.toLowerCase()))
    ), [myConfigs, table.searchQuery]);

  const filteredSharedConfigs = useMemo(() => 
    sharedConfigs.filter(c => 
      c.name.toLowerCase().includes(table.searchQuery.toLowerCase()) ||
      (c.description && c.description.toLowerCase().includes(table.searchQuery.toLowerCase()))
    ), [sharedConfigs, table.searchQuery]);

  const applySorting = useCallback((items: ReportConfig[]) => {
    if (!table.sortConfig) return items;
    const { key, direction } = table.sortConfig;
    return [...items].sort((a, b) => {
      const v1 = a[key];
      const v2 = b[key];
      
      // Handle report type meta for sorting by label if needed, 
      // but for simplicity we sort by raw value
      
      if (v1 == null) return direction === 'asc' ? 1 : -1;
      if (v2 == null) return direction === 'asc' ? -1 : 1;
      if (v1 < v2) return direction === 'asc' ? -1 : 1;
      if (v1 > v2) return direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [table.sortConfig]);

  const sortedMyConfigs = useMemo(() => applySorting(filteredMyConfigs), [filteredMyConfigs, applySorting]);
  const sortedSharedConfigs = useMemo(() => applySorting(filteredSharedConfigs), [filteredSharedConfigs, applySorting]);

  usePageSettings({
    title: t('sidebar.reports'),
    subtitle: t('reports.subtitle'),
    breadcrumbs: [
      { label: t('sidebar.workspace') },
      { label: t('sidebar.reports') }
    ],
    actions: (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button className="gap-2 h-9">
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">{t('reports.create_report')}</span>
            <ChevronDown className="w-3.5 h-3.5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuItem onClick={() => navigate('/reports/builder?type=custom')}>
            <Settings2 className="w-4 h-4 mr-2 text-primary" />
            {t('reports.universal_constructor')}
          </DropdownMenuItem>
          
          <Separator className="my-1" />
          
          <div className="px-2 py-1.5 text-[10px] font-semibold uppercase text-muted-foreground">
            {t('reports.quick_templates')}
          </div>
          <DropdownMenuItem onClick={() => navigate('/reports/builder?type=finance_register')}>
            {t('reports.payment_register')}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => navigate('/reports/builder?type=finance_pl')}>
            {t('reports.pnl_report')}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => navigate('/reports/builder?type=projects_summary')}>
            {t('reports.projects_summary')}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => navigate('/reports/builder?type=tasks_overdue')}>
            {t('reports.overdue_tasks')}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => navigate('/reports/builder?type=marketing_campaigns')}>
            {t('reports.campaign_analytics')}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    )
  });

  const handleDelete = async (id: string) => {
    if (!confirm(t('reports.confirm_delete'))) return;
    try {
      await deleteConfig.mutateAsync(id);
      toast.success(t('reports.delete_success'));
    } catch {
      toast.error(t('reports.delete_error'));
    }
  };

  const handleDuplicate = async (id: string) => {
    try {
      await duplicateConfig.mutateAsync(id);
      toast.success(t('reports.duplicate_success'));
    } catch {
      toast.error(t('reports.duplicate_error'));
    }
  };

  const handleToggleShare = async (id: string, isShared: boolean) => {
    try {
      await updateConfig.mutateAsync({ id, data: { isShared } });
      toast.success(isShared ? t('reports.access_opened_success') : t('reports.access_closed_success'));
    } catch {
      toast.error(t('common.error'));
    }
  };

  const renderReportTable = (configsList: typeof configs) => {
    if (configsList.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground bg-background rounded-xl border border-dashed">
          <BarChart2 className="w-12 h-12 mb-4 opacity-20" />
          <p className="font-medium">{t('reports.reports_not_found')}</p>
          <p className="text-sm mt-1">{t('reports.report_not_found_description')}</p>
        </div>
      );
    }

    return (
      <div className="rounded-xl border border-border/60 bg-background shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow className="hover:bg-transparent border-border/60">
              {table.visibleColumns.name && (
                <SortableTableHead 
                  label={t('common.name')} 
                  onSort={() => table.handleSort('name')}
                  direction={table.getSortDirection('name')}
                  width={table.columnWidths.name}
                  onResize={(w) => table.setColumnWidth('name', w)}
                  className="text-[11px] font-bold uppercase tracking-wider h-11"
                />
              )}
              {table.visibleColumns.type && (
                <SortableTableHead 
                  label={t('common.type')} 
                  onSort={() => table.handleSort('reportType')}
                  direction={table.getSortDirection('reportType')}
                  width={table.columnWidths.type}
                  onResize={(w) => table.setColumnWidth('type', w)}
                  className="text-[11px] font-bold uppercase tracking-wider h-11"
                />
              )}
              {table.visibleColumns.updatedAt && (
                <SortableTableHead 
                  label={t('common.updatedAt')} 
                  onSort={() => table.handleSort('updatedAt')}
                  direction={table.getSortDirection('updatedAt')}
                  width={table.columnWidths.updatedAt}
                  onResize={(w) => table.setColumnWidth('updatedAt', w)}
                  className="text-[11px] font-bold uppercase tracking-wider h-11"
                />
              )}
              {table.visibleColumns.createdBy && (
                <SortableTableHead 
                  label={t('common.owner')} 
                  onSort={() => table.handleSort('createdByName')}
                  direction={table.getSortDirection('createdByName')}
                  width={table.columnWidths.createdBy}
                  onResize={(w) => table.setColumnWidth('createdBy', w)}
                  className="text-[11px] font-bold uppercase tracking-wider h-11"
                />
              )}
              {table.visibleColumns.status && (
                <SortableTableHead 
                  label={t('common.status')} 
                  onSort={() => table.handleSort('status')}
                  direction={table.getSortDirection('status')}
                  width={table.columnWidths.status}
                  onResize={(w) => table.setColumnWidth('status', w)}
                  className="text-[11px] font-bold uppercase tracking-wider h-11"
                />
              )}
              {table.visibleColumns.actions && (
                <TableHead className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider h-11 py-2 text-right">
                  {t('common.actions')}
                </TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {configsList.map(config => {
              const meta = getReportTypeMeta(config.reportType);
              const isOwner = String(config.createdBy) === String(currentUserId);
              
              const actions = [
                { label: t('common.view'), action: 'view', icon: 'Eye' },
                { label: t('common.duplicate'), action: 'duplicate', icon: 'Copy' },
                { 
                  label: config.isShared ? t('reports.close_access') : t('common.share'), 
                  action: 'share', 
                  icon: 'Share2' 
                },
                { label: t('common.delete'), action: 'delete', icon: 'Trash2', variant: 'destructive' as const },
              ];

              const handleAction = (action: string) => {
                if (action === 'view') navigate(`/reports/view/${config.id}`);
                else if (action === 'duplicate') handleDuplicate(config.id);
                else if (action === 'share') handleToggleShare(config.id, !config.isShared);
                else if (action === 'delete') handleDelete(config.id);
              };

              return (
                <TableRow 
                  key={config.id} 
                  className="group hover:bg-muted/40 border-border/60 transition-colors cursor-pointer"
                  onClick={() => navigate(`/reports/builder/${config.id}`)}
                >
                  {table.visibleColumns.name && (
                    <TableCell className="py-3" style={{ width: table.columnWidths.name }}>
                      <div className="min-w-0">
                        <div className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                          {config.name}
                        </div>
                        {config.description && (
                          <div className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{config.description}</div>
                        )}
                      </div>
                    </TableCell>
                  )}
                  {table.visibleColumns.type && (
                    <TableCell className="py-3" style={{ width: table.columnWidths.type }} onClick={(e) => e.stopPropagation()}>
                      <Badge
                        id={String(config.reportType)}
                        variant="outline"
                        showLabel={false}
                        className="text-[10px] font-medium uppercase tracking-wider bg-background/50"
                      >
                        {meta?.label ? t(meta.label) : config.reportType}
                      </Badge>
                    </TableCell>
                  )}
                  {table.visibleColumns.updatedAt && (
                    <TableCell className="py-3" style={{ width: table.columnWidths.updatedAt }} onClick={(e) => e.stopPropagation()}>
                      <div className="text-xs text-muted-foreground">{new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(config.updatedAt))}</div>
                    </TableCell>
                  )}
                  {table.visibleColumns.createdBy && (
                    <TableCell className="py-3" style={{ width: table.columnWidths.createdBy }} onClick={(e) => e.stopPropagation()}>
                      <div className="text-xs text-muted-foreground">{config.createdByName ?? ''}</div>
                    </TableCell>
                  )}
                  {table.visibleColumns.status && (
                    <TableCell className="py-3" style={{ width: table.columnWidths.status }} onClick={(e) => e.stopPropagation()}>
                      {config.status ? <Badge id={String(config.status)} type="status" module="reports" variant="soft" size="md" /> : null}
                    </TableCell>
                  )}
                  {table.visibleColumns.actions && (
                    <TableCell className="py-3 text-right" onClick={(e) => e.stopPropagation()}>
                      <QuickActionsMenu
                        itemId={config.id}
                        itemName={config.name}
                        options={actions}
                        onAction={handleAction}
                      />
                    </TableCell>
                  )}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    );
  };

  const visibleTabs = table.tabsConfig.filter(t => t.visible);

  return (
    <div className="space-y-4">
      <Tabs
        value={visibleActiveTab}
        onValueChange={v => setActiveTab(v as typeof activeTab)}
        className="space-y-4"
      >
        {/* ─── Single row: Tabs + Toolbar ─── */}
        <div className="flex flex-nowrap justify-between items-center gap-4 overflow-x-auto overflow-y-hidden w-full mb-4 pb-1">
          <SortableTabsList
            tabsConfig={table.tabsConfig}
            onReorder={table.reorderTab}
            t={t}
            className="h-10 sm:h-11 gap-1 p-1 bg-muted/50 rounded-xl flex-shrink-0 flex-nowrap w-max"
            triggerClassName="flex-none gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg font-medium px-3 sm:px-4 whitespace-nowrap"
            renderBadge={(tabId) => {
              const count = tabId === 'my' ? myConfigs.length : sharedConfigs.length;
              if (count === 0) return null;
              return (
                <span className="ml-1 text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full group-data-[state=active]:bg-primary-foreground group-data-[state=active]:text-primary font-bold">
                  {count}
                </span>
              );
            }}
          />

          <DataTableToolbar
            searchQuery={table.searchQuery}
            onSearchChange={table.setSearchQuery}
            searchPlaceholder={t('reports.search_placeholder')}
            className="w-max flex-nowrap bg-transparent border-0 shadow-none p-0 flex-shrink-0"
            visibleColumns={table.visibleColumns}
            onToggleColumn={table.toggleColumnVisibility}
            columnLabels={COLUMN_LABELS}
            tabsConfig={table.tabsConfig}
            onMoveTab={table.moveTab}
            onToggleTab={table.toggleTabVisibility}
          />
        </div>

        {/* Мои отчёты */}
        <TabsContent value="my" className="m-0 outline-none">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : renderReportTable(sortedMyConfigs)}
        </TabsContent>

        {/* Общие отчёты */}
        <TabsContent value="shared" className="m-0 outline-none">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : renderReportTable(sortedSharedConfigs)}
        </TabsContent>
      </Tabs>
    </div>
  );
}
