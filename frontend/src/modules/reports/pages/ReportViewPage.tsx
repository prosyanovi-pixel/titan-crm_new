/**
 * Страница просмотра сохранённого отчёта
 * Маршрут: /reports/view/:id
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useParams } from 'react-router';
import { Pencil, Download, Share2, LockOpen, Loader2, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import { Button }    from '@/components/ui/button';
import { Badge }     from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import { ReportPreview } from '../components/builder/ReportPreview';
import { useReportConfig }     from '../hooks/useReportConfigs';
import { useUpdateReportConfig } from '../hooks/useReportConfigs';
import { useReportData }       from '../hooks/useReportData';
import { getReportTypeMeta }   from '../config/reportTypes';
import type { ReportType }     from '../types/reports.types';
import { usePageSettings } from '@/context/LayoutContext';
import { useDataTable } from '@/hooks/useDataTable';
import { useTranslation } from '@/lib/i18n';

type ReportRow = Record<string, unknown> & { id: string | number };

function getCurrentUserId(): string {
  // Use '2' as fallback to match api.ts standard for development
  return localStorage.getItem('titan_user_id') || '2';
}

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
  const url = URL.createObjectURL(blob);
  const a   = document.createElement('a');
  a.href = url; a.download = `${filename}.csv`; a.click();
  URL.revokeObjectURL(url);
}

/**
 * Страница просмотра сохранённого отчёта
 */
export function ReportViewPage() {
  const { t } = useTranslation();
  const navigate      = useNavigate();
  const { id }        = useParams<{ id: string }>();
  const currentUserId = getCurrentUserId();

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);

  const [localChartType, setLocalChartType] = useState<any>();
  const [localLabelKey, setLocalLabelKey] = useState<string>();
  const [localValueKey, setLocalValueKey] = useState<string>();

  const { data: configData, isLoading: configLoading } = useReportConfig(id);
  const updateConfig = useUpdateReportConfig();

  const config = configData?.config;
  const meta   = config ? getReportTypeMeta(config.reportType) : undefined;
  const isOwner = String(config?.createdBy) === String(currentUserId);

  const table = useDataTable<ReportRow>({
    initialData: [],
    initialColumns: config?.columns.reduce((acc, c) => ({ ...acc, [c]: true }), {} as Record<string, boolean>) || {},
    storageKey: config ? `report-view-${config.id}` : undefined,
  });

  // Загрузить данные отчёта с пагинацией и сортировкой
  const { data: reportData, isLoading: dataLoading } = useReportData(
    config?.reportType as ReportType | undefined,
    config?.filters || {},
    page,
    limit,
    Boolean(config),
    table.sortConfig?.key as string,
    table.sortConfig?.direction
  );

  const reportRows = reportData?.data || [];
  const totalRows = reportData?.totalRows || 0;

  const handleToggleShare = async () => {
    if (!config) return;
    try {
      await updateConfig.mutateAsync({ id: config.id, data: { isShared: !config.isShared } });
      toast.success(config.isShared ? t('reports.access_closed_success') : t('reports.access_opened_success'));
    } catch {
      toast.error(t('common.error'));
    }
  };

  const handleExport = async (format: 'csv' | 'pdf' = 'csv') => {
    if (!meta || !reportRows.length || !config) return;

    try {
      const columnLabels: Record<string, string> = {};
      meta.columns.forEach(c => { columnLabels[c.key] = c.label; });

      if (format === 'pdf') {
        const response = await fetch(`${import.meta.env.VITE_API_URL || '/api'}/reports/export`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'x-user-id': currentUserId
          },
          body: JSON.stringify({
            data: reportRows,
            columns: config.columns,
            columnLabels,
            filename: config.name.replace(/\s/g, '_'),
            format,
            title: config.name
          })
        });

        if (!response.ok) throw new Error('Export failed');
        
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${config.name.replace(/\s/g, '_')}.pdf`;
        a.click();
        window.URL.revokeObjectURL(url);
        toast.success(t('reports.pdf_generated_success'));
      } else {
        exportCsv(
          reportRows as Record<string, unknown>[],
          config.columns,
          config.name.replace(/\s/g, '_')
        );
      }
    } catch (error) {
      console.error('Export failed:', error);
      toast.error(t('reports.export_error'));
    }
  };

  usePageSettings({
    title: config?.name || (configLoading ? t('common.loading') : t('reports.report')),
    subtitle: config?.description || undefined,
    breadcrumbs: [
      { label: t('reports.title'), href: '/reports' },
      { label: config?.name || t('reports.unnamed_report') }
    ],
    actions: config ? (
      <div className="flex items-center gap-2 flex-shrink-0">
        {isOwner && (
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={handleToggleShare}
            disabled={updateConfig.isPending}
          >
            {config.isShared
              ? <><LockOpen className="w-3.5 h-3.5" />{t('reports.close_access')}</>
              : <><Share2  className="w-3.5 h-3.5" />{t('common.share')}</>
            }
          </Button>
        )}
        {isOwner && (
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={() => navigate(`/reports/builder/${config.id}`)}
          >
            <Pencil className="w-3.5 h-3.5" />
            {t('common.edit')}
          </Button>
        )}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm" className="gap-1.5" disabled={!reportRows.length}>
              <Download className="w-3.5 h-3.5" />
              {t('common.export')}
              <ChevronDown className="w-3.5 h-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleExport('pdf')}>
              {t('reports.export_pdf')}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleExport('csv')}>
              {t('reports.export_csv')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    ) : null
  });

  if (configLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!config) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
        <p className="font-medium">{t('reports.report_not_found')}</p>
        <Button variant="link" onClick={() => navigate('/reports')}>{t('reports.return_to_list')}</Button>
      </div>
    );
  }

  const visibleColumns = (meta?.columns || []).filter(c =>
    config.columns.includes(c.key)
  );

  return (
    <div className="h-full flex flex-col">
      {/* Контент */}
      <div className="flex-1 overflow-auto px-6 py-5">
        <div className="mb-4">
          <span className="text-sm text-muted-foreground">
            {meta?.label ? t(meta.label) : ''} · {totalRows.toLocaleString('ru-RU')} {t('reports.records')}
          </span>
        </div>

        <ReportPreview
          data={reportRows as ReportRow[]}
          totalRows={totalRows}
          columns={visibleColumns}
          isLoading={dataLoading}
          page={page}
          limit={limit}
          onPageChange={setPage}
          onLimitChange={setLimit}
          onExport={Array.isArray(reportRows) && reportRows.length ? handleExport : undefined}
          sortConfig={table.sortConfig ? { key: String(table.sortConfig.key), direction: table.sortConfig.direction } : null}
          onSort={(k) => table.handleSort(k as keyof ReportRow)}
          columnWidths={table.columnWidths}
          onResizeColumn={table.setColumnWidth}
          chartType={localChartType !== undefined ? localChartType : (config.filters?.chartType || 'table')}
          onChartTypeChange={setLocalChartType}
          chartLabelKey={localLabelKey !== undefined ? localLabelKey : (config.filters?.chartLabelKey as string)}
          onChartLabelKeyChange={setLocalLabelKey}
          chartValueKey={localValueKey !== undefined ? localValueKey : (config.filters?.chartValueKey as string)}
          onChartValueKeyChange={setLocalValueKey}
        />
      </div>
    </div>
  );
}
