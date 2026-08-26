import React, { forwardRef, useCallback } from 'react';
import { TableVirtuoso, TableComponents } from 'react-virtuoso';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableVirtuosoRowContext,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Search, Settings2, X, Trash2,
  ArrowUp, ArrowDown, Filter,
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
} from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import type { TabConfig } from '@/hooks/useDataTable';
import { cn, parseRowsPerPage } from '@/lib/utils';
import { TableHeaderCheckbox } from '@/components/shared/TableHeaderCheckbox';
import { SortableTableHead } from '@/components/shared/SortableTableHead';
import { EmptyState } from '@/components/shared/EmptyState';
import { Skeleton } from '@/components/ui/skeleton';

// ─── Types ─────────────────────────────────────────────────────────────────

export interface DataTableState<T = any> {
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  selectedIds: Set<string | number>;
  toggleSelection: (id: string | number) => void;
  toggleAllSelection: (items: T[]) => void;
  toggleAllPages?: () => void;
  clearSelection: () => void;
  visibleColumns: Record<string, boolean>;
  toggleColumnVisibility: (key: string, visible: boolean) => void;
  columnOrder: string[];
  moveColumn: (key: string, direction: 'up' | 'down') => void;
  reorderColumn?: (fromKey: string, toKey: string) => void;
  columnWidths?: Record<string, number>;
  setColumnWidth?: (key: string, width: number) => void;
  sortConfig?: { key: keyof T; direction: 'asc' | 'desc' } | null;
  handleSort?: (key: keyof T) => void;
  tabsConfig?: TabConfig[];
  moveTab?: (index: number, direction: 'up' | 'down') => void;
  toggleTabVisibility?: (id: string, visible: boolean) => void;
  rowsPerPage: string;
  setRowsPerPage: (value: string) => void;
  currentPage: number;
  setCurrentPage: (page: number) => void;
}

export interface DataTableProps<T = any> {
  table: DataTableState<T>;
  data?: T[];
  columnLabels: Record<string, string>;
  totalCount: number;
  renderRow?: (item: T, index: number) => React.ReactNode;
  children?: React.ReactNode;
  searchPlaceholder?: string;
  filters?: React.ReactNode;
  filterDropdownWidth?: string;
  bulkActions?: React.ReactNode;
  onBulkDelete?: () => void;
  className?: string;
  paginationClassName?: string;
  hideToolbar?: boolean;
  hidePagination?: boolean;
  virtualized?: boolean;
  virtualHeight?: string | number;
  /** Помощник для получения ID из объекта данных (если не стандартный .id) */
  getRowId?: (item: T) => string | number;
  isLoading?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: { label: string; onClick: () => void };
  enableMobileCards?: boolean;
}

// ─── Component ─────────────────────────────────────────────────────────────

export function DataTable<T>({
  table,
  data = [],
  columnLabels,
  totalCount,
  renderRow,
  children,
  searchPlaceholder,
  filters,
  filterDropdownWidth,
  bulkActions,
  onBulkDelete,
  className,
  paginationClassName,
  hideToolbar = false,
  hidePagination = false,
  virtualized = false,
  virtualHeight = '600px',
  getRowId,
  isLoading = false,
  emptyTitle,
  emptyDescription,
  emptyAction,
  enableMobileCards = true,
}: DataTableProps<T>) {
  const { t } = useTranslation();

  // Защита от undefined table
  const tableSafe = table || {} as DataTableState<T>;

  const {
    searchQuery = '',
    setSearchQuery = () => {},
    selectedIds = new Set(),
    toggleSelection = () => {},
    toggleAllSelection = () => {},
    clearSelection = () => {},
    visibleColumns = {},
    toggleColumnVisibility = () => {},
    columnOrder = [],
    moveColumn = () => {},
    reorderColumn = () => {},
    columnWidths = {},
    setColumnWidth = () => {},
    sortConfig = null,
    handleSort = () => {},
    tabsConfig = [],
    moveTab = () => {},
    toggleTabVisibility = () => {},
    rowsPerPage = '25',
    setRowsPerPage = () => {},
    currentPage = 1,
    setCurrentPage = () => {},
  } = tableSafe;

  // Универсальный способ получения ID строки
  const getItemId = useCallback((item: any): string | number | null => {
    if (getRowId) return getRowId(item);
    if (item?.id !== undefined) return item.id;
    // Поиск в типичных обертках (для дерева)
    if (item?.project?.id !== undefined) return item.project.id;
    if (item?.task?.id !== undefined) return item.task.id;
    if (item?.invoice?.id !== undefined) return item.invoice.id;
    // Для иерархических объектов, где сам объект - это проект/задача
    if (item?.project && typeof item.project === 'object') return item.project.id;
    return null;
  }, [getRowId]);

  const perPage = parseRowsPerPage(rowsPerPage);
  const totalPages = Math.max(1, Math.ceil(totalCount / perPage));
  const shownCount = perPage === Infinity ? totalCount : Math.min(perPage, Math.max(0, totalCount - (currentPage - 1) * perPage));

  // ── Helpers ───────────────────────────────────────────────────
  const getPages = useCallback((): (number | '…')[] => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const pages: (number | '…')[] = [];
    if (currentPage <= 4) {
      pages.push(1, 2, 3, 4, 5, '…', totalPages);
    } else if (currentPage >= totalPages - 3) {
      pages.push(1, '…', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
    } else {
      pages.push(1, '…', currentPage - 1, currentPage, currentPage + 1, '…', totalPages);
    }
    return pages;
  }, [totalPages, currentPage]);

  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };

  const isCurrentPageSelected = data.length > 0 && data.every(item => selectedIds.has(getItemId(item)));
  const isSomeSelected = selectedIds.size > 0 && !isCurrentPageSelected;

  const handleToggleCurrentPage = () => {
    // Формируем массив ID для передачи в хук
    const idsToSelect = data.map(item => getItemId(item)).filter(id => id !== null);
    // Мы вызываем toggleAllSelection, но он в хуке ожидает массив объектов.
    // Чтобы не ломать хук, передадим объекты с нужными ID.
    toggleAllSelection(data.map(item => ({ id: getItemId(item) } as any)));
  };

  const renderCompleteHead = () => {
    const visibleKeys = columnOrder.filter(key => visibleColumns[key]);
    return (
      <thead className="sticky top-0 bg-muted/30 backdrop-blur-sm z-10 border-b">
        <TableRow className="bg-transparent hover:bg-transparent border-b-0">
          <TableHead className="w-10">
            <TableHeaderCheckbox
              isCurrentPageSelected={isCurrentPageSelected}
              isSomeSelected={isSomeSelected}
              onToggleCurrentPage={handleToggleCurrentPage}
              onClearSelection={clearSelection}
              onSelectCurrentPageOnly={handleToggleCurrentPage}
              selectedCount={selectedIds.size}
              currentPageCount={data.length}
              totalCount={totalCount}
              showDropdown={true}
            />
          </TableHead>
          {visibleKeys.map(key => (
            <SortableTableHead
              key={key}
              columnKey={key}
              label={t(columnLabels[key] ?? key)}
              onSort={handleSort ? () => handleSort(key as keyof T) : (() => {})}
              direction={sortConfig?.key === key ? sortConfig.direction : null}
              width={columnWidths?.[key]}
              onResize={setColumnWidth ? (w) => setColumnWidth(key, w) : (() => {})}
              className="text-[10px] sm:text-[11px] uppercase tracking-wider font-bold text-muted-foreground/90"
            />
          ))}
          <TableHead className="w-10" />
        </TableRow>
      </thead>
    );
  };

  /** Colgroup rendered inside every table variant so header <th> and body <td> share widths. */
  const renderColGroup = () => {
    const visibleKeys = columnOrder.filter(key => visibleColumns[key]);
    return (
      <colgroup>
        <col style={{ width: '40px', minWidth: '40px' }} />
        {visibleKeys.map(key => (
          <col
            key={key}
            style={{
              width: columnWidths?.[key] ? `${columnWidths[key]}px` : undefined,
              minWidth: columnWidths?.[key] ? `${columnWidths[key]}px` : '80px',
            }}
          />
        ))}
        <col style={{ width: '50px', minWidth: '50px' }} />
      </colgroup>
    );
  };

  const virtuosoComponents = React.useMemo<TableComponents>(() => ({
    Table: ({ style, children, ...props }) => (
      <table
        {...props}
        style={{ ...style, width: '100%', tableLayout: 'fixed' }}
        className="w-full caption-bottom text-sm bg-background"
      >
        {renderColGroup()}
        {renderCompleteHead()}
        {children}
      </table>
    ),
    TableBody: forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>((props, ref) => <tbody ref={ref} className="bg-background [&_tr:last-child]:border-0" {...props} />),
    // @ts-ignore: Virtuoso's TS definitions are too strict for custom context-based forwardRefs
    TableRow: forwardRef<HTMLTableRowElement, any>(({ item: _item, 'data-index': dataIndex, children, ...rest }, ref) => {
      return (
        <TableVirtuosoRowContext.Provider value={{ ref, props: { ...rest, 'data-index': dataIndex } }}>
          {children}
        </TableVirtuosoRowContext.Provider>
      );
    }),
  }), [renderCompleteHead, renderColGroup]);

  const noData = data.length === 0;

  return (
    <div className={cn(
      'flex flex-col titan-card overflow-hidden bg-background',
      enableMobileCards && 'table-mobile-cards',
      className
    )}>
      {!hideToolbar && (
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 p-3 border-b border-border bg-background">
          {selectedIds.size > 0 ? (
            <div className="flex items-center gap-2 bg-primary/5 px-3 py-1.5 rounded-lg flex-1 overflow-x-auto border border-primary/10">
              <span className="text-sm font-bold text-primary whitespace-nowrap">
                {t('common.selected')}: {selectedIds.size}
              </span>
              <Button variant="ghost" size="sm" onClick={clearSelection} className="h-7 text-xs hover:bg-primary/10 text-primary">
                <X className="w-3.5 h-3.5 mr-1.5" />
                {t('common.cancel')}
              </Button>
              <div className="h-4 w-px bg-primary/20 mx-1 hidden sm:block" />
              {bulkActions}
              {onBulkDelete && (
                <Button variant="destructive" size="sm" onClick={onBulkDelete} className="h-7 text-xs">
                  <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                  <span className="hidden sm:inline">{t('common.delete')}</span>
                </Button>
              )}
            </div>
          ) : (
            <>
              <div className="relative flex-1 sm:max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder={searchPlaceholder ?? t('common.search')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-9 w-full bg-muted/20 border-muted-foreground/20 focus:border-primary transition-all"
                />
              </div>
              <div className="flex items-center gap-2 ml-auto">
                {filters && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="h-9 gap-2 border-muted-foreground/20">
                        <Filter className="w-4 h-4" />
                        <span className="hidden xs:inline">{t('common.filter')}</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className={filterDropdownWidth ?? 'w-56'}>
                      {filters}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-9 w-9 border border-muted-foreground/20">
                      <Settings2 className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64 max-h-[70vh] overflow-y-auto">
                  {tabsConfig && tabsConfig.length > 0 && moveTab && toggleTabVisibility && (
                    <>
                      <DropdownMenuLabel>{t('generated.vkladki')}</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      {tabsConfig.map((tab, index) => (
                        <div key={tab.id} className="flex items-center justify-between p-2 hover:bg-muted rounded-sm text-sm">
                          <div className="flex items-center gap-2 cursor-pointer select-none flex-1" onClick={(e) => { e.preventDefault(); toggleTabVisibility(tab.id, !tab.visible); }}>
                            <Checkbox checked={tab.visible} onCheckedChange={(checked) => toggleTabVisibility(tab.id, !!checked)} />
                            <span>{t(tab.label)}</span>
                          </div>
                          <div className="flex gap-1">
                            <Button size="icon" variant="ghost" className="h-6 w-6" onClick={(e) => { e.preventDefault(); moveTab(index, 'up'); }} disabled={index === 0}>
                              <ArrowUp className="w-3 h-3" />
                            </Button>
                            <Button size="icon" variant="ghost" className="h-6 w-6" onClick={(e) => { e.preventDefault(); moveTab(index, 'down'); }} disabled={index === tabsConfig.length - 1}>
                              <ArrowDown className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                      <DropdownMenuSeparator />
                    </>
                  )}
                  {columnOrder && columnOrder.length > 0 && (
                    <>
                      <DropdownMenuLabel>{t('common.columns')}</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      {columnOrder.map((key, index) => (
                        <div key={key} className="group flex items-center justify-between px-2 py-1 hover:bg-muted rounded-sm text-sm">
                          <div className="flex items-center gap-2 cursor-pointer select-none flex-1" onClick={() => toggleColumnVisibility(key, !visibleColumns[key])}>
                            <Checkbox checked={!!visibleColumns[key]} onCheckedChange={(checked) => toggleColumnVisibility(key, !!checked)} />
                            <span>{t(columnLabels?.[key] ?? key)}</span>
                          </div>
                          {moveColumn && (
                            <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button size="icon" variant="ghost" className="h-5 w-5" onClick={(e) => { e.preventDefault(); moveColumn(key, 'up'); }} disabled={index === 0}>
                                <ArrowUp className="w-3 h-3" />
                              </Button>
                              <Button size="icon" variant="ghost" className="h-5 w-5" onClick={(e) => { e.preventDefault(); moveColumn(key, 'down'); }} disabled={index === columnOrder.length - 1}>
                                <ArrowDown className="h-3 w-3" />
                              </Button>
                            </div>
                          )}
                        </div>
                      ))}
                    </>
                  )}
                </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </>
          )}
        </div>
      )}
      <div className="relative border-b border-border bg-background overflow-hidden" style={{ minHeight: '400px', height: virtualized ? (typeof virtualHeight === 'number' ? `${virtualHeight}px` : virtualHeight) : 'auto' }}>
        {children ? (
          <div className="overflow-auto h-full scrollbar-stable bg-background">{children}</div>
        ) : virtualized && renderRow && !noData ? (
          <TableVirtuoso
            data={data}
            components={virtuosoComponents}
            itemContent={(index, item) => renderRow(item as T, index)}
            style={{ height: '100%' }}
            className="scrollbar-stable bg-background"
            increaseViewportBy={200}
          />
        ) : (
          <div className="overflow-auto h-full scrollbar-stable bg-background">
            <table className="w-full caption-bottom text-sm border-collapse bg-background" style={{ tableLayout: 'fixed' }}>
              {renderColGroup()}
              {renderCompleteHead()}
              <tbody className="bg-background [&_tr:last-child]:border-0">
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={`skeleton-${i}`}>
                      <TableCell className="w-10"><Skeleton className="h-4 w-4" /></TableCell>
                      {columnOrder.filter(key => visibleColumns[key]).map(key => (
                        <TableCell key={`skeleton-${i}-${key}`}><Skeleton className="h-4 w-full" /></TableCell>
                      ))}
                      <TableCell className="w-10" />
                    </TableRow>
                  ))
                ) : noData ? (
                  <TableRow>
                    <TableCell colSpan={columnOrder.length + 2} className="h-96 text-center text-muted-foreground">
                      <EmptyState
                        title={emptyTitle ?? t('common.no_data')}
                        description={emptyDescription ?? t('generated.poprobuyte_izmenit_parametry_poiska_ili_fil_try')}
                        action={emptyAction}
                        className="border-none"
                      />
                    </TableCell>
                  </TableRow>
                ) : (
                  data.map((item, index) => {
                    const id = getItemId(item as T);
                    const isSelected = id !== null && selectedIds.has(id);
                    const row = renderRow!(item as T, index);
                    
                    if (!React.isValidElement(row)) return null;
                    
                    return (
                      <React.Fragment key={id || index}>
                        {React.cloneElement(row as React.ReactElement, { 
                          "data-state": isSelected ? "selected" : undefined 
                        } as any)}
                      </React.Fragment>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {!hidePagination && (
        <div className={cn('flex items-center justify-between p-4 border-t border-border flex-wrap gap-2 bg-muted/5', paginationClassName)}>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span className="font-medium">{t('common.shown_of').replace('{0}', shownCount.toString()).replace('{1}', totalCount.toString())}</span>
            {totalPages > 1 && <span className="hidden sm:inline border-l border-border pl-3">{t('common.page_of_pages').replace('{0}', currentPage.toString()).replace('{1}', totalPages.toString())}</span>}
          </div>
          <div className="flex items-center gap-2 flex-wrap justify-end">
            <span className="text-xs text-muted-foreground hidden sm:inline uppercase tracking-wider font-bold opacity-70">{t('common.rows_per_page')}:</span>
            <Select value={rowsPerPage} onValueChange={(v) => { setRowsPerPage(v); setCurrentPage(1); }}>
              <SelectTrigger className="h-8 w-[75px] bg-background"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5</SelectItem>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
                <SelectItem value="all">{t('generated.vse')}</SelectItem>
              </SelectContent>
            </Select>
            {totalPages > 1 && (
              <div className="flex items-center gap-1 ml-2">
                <Button variant="outline" size="icon" className="h-8 w-8 bg-background" disabled={currentPage <= 1} onClick={() => handlePageChange(1)} aria-label={t('common.pagination.first')}><ChevronsLeft className="h-4 w-4" /></Button>
                <Button variant="outline" size="icon" className="h-8 w-8 bg-background" disabled={currentPage <= 1} onClick={() => handlePageChange(currentPage - 1)} aria-label={t('common.pagination.prev')}><ChevronLeft className="h-4 w-4" /></Button>
                <div className="hidden sm:flex items-center gap-1 px-1">
                  {getPages().map((p, i) => p === '…' ? <span key={`ellipsis-${i}`} className="px-1 text-muted-foreground text-sm select-none">…</span> : <Button key={p} variant={p === currentPage ? 'default' : 'ghost'} size="icon" className="h-8 w-8 text-xs font-bold" onClick={() => handlePageChange(p as number)} aria-label={t('common.pagination.page', [p])} aria-current={p === currentPage ? 'page' : undefined}>{p}</Button>)}
                </div>
                <Button variant="outline" size="icon" className="h-8 w-8 bg-background" disabled={currentPage >= totalPages} onClick={() => handlePageChange(currentPage + 1)} aria-label={t('common.pagination.next')}><ChevronRight className="h-4 w-4" /></Button>
                <Button variant="outline" size="icon" className="h-8 w-8 bg-background" disabled={currentPage >= totalPages} onClick={() => handlePageChange(totalPages)} aria-label={t('common.pagination.last')}><ChevronsRight className="h-4 w-4" /></Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
