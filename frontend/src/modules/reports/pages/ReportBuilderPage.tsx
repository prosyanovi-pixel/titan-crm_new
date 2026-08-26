/**
 * Конструктор отчётов — главная страница создания/редактирования конфигурации
 *
 * Маршруты:
 *   /reports/builder       — создать новый отчёт
 *   /reports/builder/:id   — редактировать существующий
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useParams } from 'react-router';
import { ArrowLeft, Save, ChevronDown, Filter, Columns, RefreshCcw } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';

import { ReportTypeSelector }    from '../components/builder/ReportTypeSelector';
import { ReportFiltersForm }     from '../components/builder/ReportFiltersForm';
import { ReportColumnsSelector } from '../components/builder/ReportColumnsSelector';
import { ReportPreview }         from '../components/builder/ReportPreview';
import { SaveConfigDialog }      from '../components/builder/SaveConfigDialog';

import { useReportFilters }    from '../hooks/useReportFilters';
import { useReportData }       from '../hooks/useReportData';
import { useReportConfig }     from '../hooks/useReportConfigs';
import { useCreateReportConfig, useUpdateReportConfig } from '../hooks/useReportConfigs';

import { REPORT_TYPES_META, getReportTypeMeta } from '../config/reportTypes';
import type { ReportType, ReportConfigFormData, ReportColumnDef } from '../types/reports.types';
import { usePageSettings } from '@/context/LayoutContext';
import { useDataTable } from '@/hooks/useDataTable';
import type { DatePreset } from '../hooks/useReportFilters';
import type { ReportFilters } from '../types/reports.types';
import { useTranslation } from '@/lib/i18n';

/** CSV экспорт (клиентский) */
function exportCsv(rows: Record<string, unknown>[], columns: string[], filename: string) {
  if (!rows.length) return;
  const headers = columns.length ? columns : Object.keys(rows[0]);
  const lines = [
    headers.join(';'),
    ...rows.map(r =>
      headers.map(h => {
        const v = String(r[h] ?? '');
        return v.includes(';') || v.includes('"') ? `"${v.replace(/"/g, '""')}"` : v;
      }).join(';')
    ),
  ];
  const blob = new Blob(['\uFEFF' + lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url; a.download = `${filename}.csv`; a.click();
  URL.revokeObjectURL(url);
}

/**
 * Страница конструктора отчётов
 */
export function ReportBuilderPage() {
  const { t } = useTranslation();
  const navigate           = useNavigate();
  const location           = useLocation();
  const { id: editId }     = useParams<{ id?: string }>();
  const isEdit             = Boolean(editId);

  // 1. Загрузка существующей конфигурации
  const { data: existingData } = useReportConfig(editId);

  // 2. Состояние конструктора
  const [reportType,    setReportType]    = useState<ReportType | undefined>();
  const [selectedCols,  setSelectedCols]  = useState<string[]>([]);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);

  // 3. Фильтры и Пагинация
  const { filters, activePreset, setFilter, setPreset, resetFilters, setFilters } = useReportFilters();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  // 4. Массовые мутации
  const createConfig = useCreateReportConfig();
  const updateConfig = useUpdateReportConfig();

  // 5. Обработчики
  const handleTypeChange = useCallback((type: ReportType) => {
    setReportType(type);
    const meta = getReportTypeMeta(type);
    setSelectedCols(meta?.defaultCols || []);
    resetFilters();
    setPage(1);
    
    // Для универсального конструктора ставим дефолтный источник
    if (type === 'custom') {
      setFilters({ sourceEntity: 'contracts' });
      setSelectedCols(['name', 'status', 'amount', 'date']);
    }
  }, [resetFilters, setFilters]);

  const handleFilterChange = useCallback((key: keyof ReportFilters, value: unknown) => {
    setFilter(key, value);
    setPage(1);
  }, [setFilter]);

  const handlePresetChange = useCallback((preset: DatePreset) => {
    setPreset(preset);
    setPage(1);
  }, [setPreset]);

  const handleResetFilters = useCallback(() => {
    resetFilters();
    setPage(1);
  }, [resetFilters]);

  // Обработка query-параметра type через derived state
  const [prevLocationSearch, setPrevLocationSearch] = useState(location.search);
  if (!isEdit && !reportType && location.search !== prevLocationSearch) {
    setPrevLocationSearch(location.search);
    const params = new URLSearchParams(location.search);
    const typeParam = params.get('type') as ReportType;
    if (typeParam && getReportTypeMeta(typeParam)) {
      handleTypeChange(typeParam);
    }
  }

  // Дебаунс фильтров
  const [debouncedFilters, setDebouncedFilters] = useState(filters);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedFilters(filters), 400);
    return () => clearTimeout(timer);
  }, [filters]);

  // Заполнить состояние при редактировании через derived state
  const [prevExistingDataConfig, setPrevExistingDataConfig] = useState(existingData?.config);
  if (existingData?.config !== prevExistingDataConfig) {
    setPrevExistingDataConfig(existingData?.config);
    if (existingData?.config) {
      const { config } = existingData;
      setReportType(config.reportType as ReportType);
      setFilters(config.filters || {});
      setSelectedCols(config.columns || []);
      setPage(1);
    }
  }

  const customSource = reportType === 'custom' ? String(filters.sourceEntity || 'contracts') : undefined;
  const customColumns = useMemo<ReportColumnDef[]>(() => {
    if (reportType !== 'custom') return [];
    return customSource === 'projects'
      ? [
          { key: 'name', label: t('common.project'), type: 'text' },
          { key: 'status', label: t('common.status'), type: 'badge' },
          { key: 'amount', label: t('common.budget'), type: 'currency', align: 'right' },
          { key: 'date', label: t('common.deadline'), type: 'date' },
          { key: 'assignedTo', label: t('common.manager'), type: 'text' },
        ]
      : customSource === 'tasks'
        ? [
            { key: 'name', label: t('common.task'), type: 'text' },
            { key: 'status', label: t('common.status'), type: 'badge' },
            { key: 'amount', label: t('common.amount'), type: 'currency', align: 'right' },
            { key: 'date', label: t('common.term'), type: 'date' },
            { key: 'assignedTo', label: t('common.assignee'), type: 'text' },
          ]
        : customSource === 'contractors'
          ? [
              { key: 'name', label: t('common.contractor'), type: 'text' },
              { key: 'status', label: t('common.status'), type: 'badge' },
              { key: 'amount', label: t('common.amount'), type: 'currency', align: 'right' },
              { key: 'date', label: t('common.date'), type: 'date' },
              { key: 'assignedTo', label: t('common.assignee'), type: 'text' },
            ]
          : customSource === 'finance'
            ? [
                { key: 'date', label: t('common.date'), type: 'date' },
                { key: 'kind', label: t('common.type'), type: 'badge' },
                { key: 'amount', label: t('common.amount'), type: 'currency', align: 'right' },
                { key: 'contractorName', label: t('common.contractor'), type: 'text' },
                { key: 'projectName', label: t('common.project'), type: 'text' },
              ]
            : REPORT_TYPES_META.find(m => m.type === 'custom')?.columns || [];
  }, [customSource, reportType]);

  const meta = reportType ? getReportTypeMeta(reportType) : undefined;

  const availableColumns = useMemo(
    () => (reportType === 'custom' ? customColumns : meta?.columns || []),
    [customColumns, meta, reportType]
  );
  const defaultSelectedCustomCols = useMemo(
    () => availableColumns.slice(0, 4).map(c => c.key),
    [availableColumns]
  );
  const resolvedSelectedCols = useMemo(() => {
    if (reportType !== 'custom') return selectedCols;
    const isValid = selectedCols.length > 0 && selectedCols.every(key => availableColumns.some(c => c.key === key));
    return isValid ? selectedCols : defaultSelectedCustomCols;
  }, [availableColumns, defaultSelectedCustomCols, reportType, selectedCols]);

  // 6. Вычисляемые данные (Правила хуков: всегда на верхнем уровне)
  const previewColumns = useMemo(() => {
    if (!availableColumns.length) return [];
    return resolvedSelectedCols
      .map(key => availableColumns.find(c => c.key === key))
      .filter(Boolean) as ReportColumnDef[];
  }, [availableColumns, resolvedSelectedCols]);

  const activeFiltersCount = Object.values(filters).filter(v => v != null && v !== '').length;

  const table = useDataTable({
    initialData: [],
    initialColumns: meta?.columns.reduce((acc, c) => ({ ...acc, [c.key]: true }), {}) || {},
    storageKey: editId ? `report-builder-${editId}` : 'report-builder-new',
  });

  const handlePreviewSort = useCallback((key: string) => {
    table.handleSort(key as never);
  }, [table]);

  // 7. Загрузка данных для предпросмотра
  const { data: previewData, isLoading: previewLoading } = useReportData(
    reportType,
    debouncedFilters,
    page,
    limit,
    Boolean(reportType),
    table.sortConfig?.key as string,
    table.sortConfig?.direction
  );

  const previewRows = previewData?.data || [];
  const totalRows = previewData?.totalRows || 0;

  const handleSave = async (saveData: Pick<ReportConfigFormData, 'name' | 'description' | 'chartType' | 'isShared' | 'status'>) => {
    if (!reportType) return;

    const payload: ReportConfigFormData = {
      ...saveData,
      reportType,
      filters,
      columns: resolvedSelectedCols,
    };

    try {
      if (isEdit && editId) {
        await updateConfig.mutateAsync({ id: editId, data: payload });
        toast.success(t('reports.update_success'));
      } else {
        await createConfig.mutateAsync(payload);
        toast.success(t('reports.create_success'));
      }
      setSaveDialogOpen(false);
      navigate('/reports');
    } catch {
      toast.error(t('reports.save_error'));
    }
  };

  const handleExport = async (format: 'csv' | 'pdf' = 'csv') => {
    if (!meta || !previewRows.length) return;
    const cols = selectedCols.length ? selectedCols : meta.columns.map(c => c.key);
    
    try {
      if (format === 'pdf') {
        const columnLabels: Record<string, string> = {};
        meta.columns.forEach(c => { columnLabels[c.key] = c.label; });

        const response = await fetch(`${import.meta.env.VITE_API_URL || '/api'}/reports/export`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'x-user-id': localStorage.getItem('titan_user_id') || '2'
          },
          body: JSON.stringify({
            data: previewRows,
            columns: cols,
            columnLabels,
            filename: t(meta.label).replace(/\s/g, '_'),
            format,
            title: t(meta.label)
          })
        });

        if (!response.ok) throw new Error('Export failed');
        
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${t(meta.label).replace(/\s/g, '_')}.pdf`;
        a.click();
        window.URL.revokeObjectURL(url);
        toast.success(t('reports.pdf_generated_success'));
      } else {
        exportCsv(previewRows as Record<string, unknown>[], cols, t(meta.label).replace(/\s/g, '_'));
      }
    } catch (error) {
      console.error('Export failed:', error);
      toast.error(t('reports.export_error'));
    }
  };

  const isSaving = createConfig.isPending || updateConfig.isPending;

  usePageSettings({
    title: isEdit ? t('reports.edit_report') : t('reports.builder_title'),
    breadcrumbs: [
      { label: t('reports.title'), href: '/reports' },
      { label: isEdit ? t('common.edit') : t('common.new') }
    ],
    actions: (
      <div className="flex items-center gap-2">
        {reportType && (
          <Button variant="outline" size="sm" onClick={() => handleTypeChange(reportType)} className="gap-1.5 h-9">
            <RefreshCcw className="w-4 h-4" />
            {t('common.reset')}
          </Button>
        )}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm" disabled={!reportType || isSaving} className="gap-1.5 h-9">
              <Save className="w-4 h-4" />
              {t('common.save')}
              <ChevronDown className="w-3.5 h-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setSaveDialogOpen(true)}>
              {isEdit ? t('reports.save_changes') : t('reports.save_as')}
            </DropdownMenuItem>
            {previewRows.length > 0 && (
              <>
                <Separator className="my-1" />
                <DropdownMenuItem onClick={() => handleExport('pdf')}>
                  {t('reports.export_pdf')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport('csv')}>
                  {t('reports.export_csv')}
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    )
  });

  return (
    <div className="h-full flex flex-col">
      {/* Основной layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Левая панель — только выбор типа */}
        <div className="w-72 flex-shrink-0 border-r flex flex-col overflow-hidden bg-muted/10">
          <div className="p-4 border-b flex items-center gap-2">
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={() => navigate('/reports')}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              {t('reports.report_type')}
            </h2>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-4">
              <ReportTypeSelector value={reportType} onChange={handleTypeChange} />
            </div>
          </ScrollArea>
        </div>

        {/* Правая панель — предпросмотр и инструменты */}
        <div className="flex-1 overflow-auto flex flex-col">
          {!reportType ? (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <div className="w-16 h-16 rounded-2xl bg-muted mx-auto mb-4 flex items-center justify-center">
                  <Save className="w-7 h-7 opacity-30" />
                </div>
                <p className="font-medium">{t('reports.start_with_type')}</p>
                <p className="text-sm mt-1">{t('reports.select_category_in_panel')}</p>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col">
              {/* Toolbar отчёта */}
              <div className="px-6 py-4 border-b bg-card flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <h2 className="text-lg font-semibold truncate">{meta?.label ? t(meta.label) : ''}</h2>
                  {meta?.description && (
                    <p className="text-sm text-muted-foreground mt-0.5 line-clamp-1">{t(meta.description)}</p>
                  )}
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  {/* Кнопка фильтров */}
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm" className="gap-2 h-9">
                        <Filter className="w-4 h-4" />
                        {t('common.filters')}
                        {activeFiltersCount > 0 && (
                          <Badge variant="secondary" className="ml-1 px-1.5 h-5 min-w-[20px] justify-center">
                            {activeFiltersCount}
                          </Badge>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent align="end" className="w-80 p-4">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="text-sm font-semibold">{t('reports.report_filters')}</h3>
                          <Button variant="ghost" size="sm" onClick={resetFilters} className="h-7 text-xs">
                            {t('common.reset')}
                          </Button>
                        </div>
                        <ReportFiltersForm
                          filterFields={meta?.filterFields || []}
                          filters={filters}
                          activePreset={activePreset}
                          onFilterChange={handleFilterChange}
                          onPresetChange={handlePresetChange}
                          onReset={handleResetFilters}
                        />
                      </div>
                    </PopoverContent>
                  </Popover>

                  {/* Кнопка колонок */}
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm" className="gap-2 h-9">
                        <Columns className="w-4 h-4" />
                        {t('common.columns')}
                        <Badge variant="secondary" className="ml-1 px-1.5 h-5">
                          {resolvedSelectedCols.length}
                        </Badge>
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent align="end" className="w-72 p-4">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="text-sm font-semibold">{t('reports.visible_columns')}</h3>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => setSelectedCols(defaultSelectedCustomCols)} 
                            className="h-7 text-xs"
                          >
                            {t('common.default')}
                          </Button>
                        </div>
                        <ReportColumnsSelector
                          columns={reportType === 'custom' ? customColumns : meta?.columns || []}
                          selectedCols={resolvedSelectedCols}
                          onChange={setSelectedCols}
                        />
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              {/* Тело отчёта */}
              <div className="flex-1 p-6">
                <ReportPreview
                  data={previewRows as Record<string, unknown>[]}
                  totalRows={totalRows}
                  columns={previewColumns}
                  isLoading={previewLoading}
                  page={page}
                  limit={limit}
                  onPageChange={setPage}
                  onLimitChange={setLimit}
                  onExport={previewRows.length ? () => handleExport('csv') : undefined}
                  sortConfig={table.sortConfig ? { key: String(table.sortConfig.key), direction: table.sortConfig.direction } : null}
                  onSort={handlePreviewSort}
                  columnWidths={table.columnWidths}
                  onResizeColumn={table.setColumnWidth}
                  chartType={(filters.chartType || 'table') as any}
                  onChartTypeChange={(val) => handleFilterChange('chartType', val)}
                  chartLabelKey={filters.chartLabelKey as string}
                  onChartLabelKeyChange={(val) => handleFilterChange('chartLabelKey', val)}
                  chartValueKey={filters.chartValueKey as string}
                  onChartValueKeyChange={(val) => handleFilterChange('chartValueKey', val)}
                />

              </div>
            </div>
          )}
        </div>
      </div>

      {/* Диалог сохранения */}
      <SaveConfigDialog
        open={saveDialogOpen}
        onClose={() => setSaveDialogOpen(false)}
        onSave={handleSave}
        initialName={isEdit ? existingData?.config.name : ''}
        initialStatus={isEdit ? existingData?.config.status : undefined}
        isSaving={isSaving}
      />
    </div>
  );
}
