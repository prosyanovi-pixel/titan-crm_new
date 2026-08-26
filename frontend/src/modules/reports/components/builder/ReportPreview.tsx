/**
 * Предпросмотр данных отчёта в конструкторе
 */

import * as React from 'react';
import { useTranslation } from '@/lib/i18n';
import { Download, Table2, BarChart2 as BarChartIcon } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TableFooterPagination, SortableTableHead } from '@/components/shared';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Cell, Line, LineChart, Pie, PieChart, Legend } from 'recharts';
import type { ReportColumnDef } from '../../types/reports.types';
import { UniversalTagList } from '@/components/ui/status-system';
import { Table, TableBody, TableCell, TableHeader, TableRow } from '@/components/ui/table';

const CHART_COLORS = [
  '#3b82f6', // blue
  '#10b981', // green
  '#f59e0b', // amber
  '#ef4444', // red
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#06b6d4', // cyan
];

/** Форматирование значения ячейки по типу колонки */
function formatCell(value: unknown, type: ReportColumnDef['type'], key: string, t: ReturnType<typeof useTranslation>['t']): React.ReactNode {
  if (value == null) return <span className="text-muted-foreground">—</span>;

  // Специальная обработка для тегов
  if (key === 'tags' && Array.isArray(value)) {
    return <UniversalTagList tags={value} maxVisible={2} />;
  }

  switch (type) {
    case 'currency': {
      const n = Number(value);
      return (
        <span className="font-mono">
          {new Intl.NumberFormat('ru-RU', {
            style: 'currency', currency: 'RUB',
            minimumFractionDigits: 0, maximumFractionDigits: 0,
          }).format(n)}
        </span>
      );
    }
    case 'date':
      return <span className="font-mono text-xs">{String(value).substring(0, 10)}</span>;
    case 'badge':
      return (
        <Badge variant="outline" className={`text-xs ${
          value === 'income' ? 'border-green-400 text-green-700' :
          value === 'expense' ? 'border-red-400 text-red-700' : 
          value === 'completed' ? 'border-blue-400 text-blue-700' :
          value === 'active' ? 'border-orange-400 text-orange-700' : ''
        }`}>
          {value === 'income' ? t('reports.preview.income') : 
           value === 'expense' ? t('reports.preview.expense') : 
           value === 'completed' ? t('reports.preview.completed') :
           value === 'active' ? t('reports.preview.active') : String(value)}
        </Badge>
      );
    case 'number':
      return <span className="font-mono">{Number(value).toLocaleString('ru-RU')}</span>;
    default:
      return <span>{String(value)}</span>;
  }
}

interface ReportPreviewProps {
  data:      Record<string, unknown>[];
  totalRows: number;
  columns:   ReportColumnDef[];
  isLoading: boolean;
  page:      number;
  limit:     number;
  onPageChange: (p: number) => void;
  onLimitChange: (l: number) => void;
  onExport?: () => void;
  
  // New props for sorting and resizing
  sortConfig?: { key: string; direction: 'asc' | 'desc' } | null;
  onSort?: (key: string) => void;
  columnWidths?: Record<string, number>;
  onResizeColumn?: (key: string, width: number) => void;

  // New charting props
  chartType?: 'bar' | 'line' | 'pie' | 'table';
  onChartTypeChange?: (type: 'bar' | 'line' | 'pie' | 'table') => void;
  chartLabelKey?: string;
  onChartLabelKeyChange?: (key: string) => void;
  chartValueKey?: string;
  onChartValueKeyChange?: (key: string) => void;
}

/**
 * Таблица предпросмотра данных отчёта
 */
export function ReportPreview({ 
  data, totalRows, columns, isLoading, 
  page, limit, onPageChange, onLimitChange,
  onExport,
  sortConfig, onSort, columnWidths = {}, onResizeColumn,
  chartType, onChartTypeChange,
  chartLabelKey, onChartLabelKeyChange,
  chartValueKey, onChartValueKeyChange
}: ReportPreviewProps) {
  const { t } = useTranslation();
  const [localView, setLocalView] = React.useState<'table' | 'chart'>('table');
  const [localChartType, setLocalChartType] = React.useState<'bar' | 'line' | 'pie'>('bar');
  const [localLabelKey, setLocalLabelKey] = React.useState<string>('');
  const [localValueKey, setLocalValueKey] = React.useState<string>('');

  const currentView = onChartTypeChange ? (chartType === 'table' ? 'table' : 'chart') : localView;
  const currentChartType = onChartTypeChange ? (chartType !== 'table' ? chartType : 'bar') : localChartType;

  const visibleCols = columns.filter(c => Array.isArray(data) && data.some(row => c.key in row));
  const textCols = visibleCols.filter(c => c.type === 'text');
  const numCols = visibleCols.filter(c => c.type === 'currency' || c.type === 'number');

  const resolvedLabelKey = chartLabelKey || localLabelKey || textCols[0]?.key || visibleCols[0]?.key || '';
  const resolvedValueKey = chartValueKey || localValueKey || numCols[0]?.key || '';

  // Логика для графика
  const chartConfig = React.useMemo(() => {
    if (!resolvedLabelKey || !resolvedValueKey) return null;
    const labelCol = visibleCols.find(c => c.key === resolvedLabelKey);
    const valueCol = visibleCols.find(c => c.key === resolvedValueKey);
    
    if (!labelCol || !valueCol) return null;

    return {
      labelKey: resolvedLabelKey,
      valueKey: resolvedValueKey,
      labelName: labelCol.label,
      valueName: valueCol.label,
      config: {
        [resolvedValueKey]: { label: valueCol.label, color: 'hsl(var(--primary))' }
      }
    };
    // eslint-disable-next-line react-hooks/preserve-manual-memoization
  }, [resolvedLabelKey, resolvedValueKey, visibleCols]);

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-9 w-full" />)}
      </div>
    );
  }

  if (!Array.isArray(data) || !data.length) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
        <Table2 className="w-10 h-10 mb-3 opacity-30" />
        <p className="text-sm">{t('reports.preview.no_data')}</p>
        <p className="text-xs mt-1">{t('reports.preview.change_filters')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Тулбар */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-1 rounded-md border overflow-hidden text-xs">
          <button
            type="button"
            onClick={() => {
              if (onChartTypeChange) onChartTypeChange('table');
              else setLocalView('table');
            }}
            className={`px-3 py-1.5 flex items-center gap-1.5 transition-colors ${
              currentView === 'table' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
            }`}
          >
            <Table2 className="w-3.5 h-3.5" />
            {t('reports.preview.table')}
          </button>
          <button
            type="button"
            onClick={() => {
              if (onChartTypeChange) onChartTypeChange(currentChartType as any);
              else setLocalView('chart');
            }}
            disabled={!chartConfig}
            className={`px-3 py-1.5 flex items-center gap-1.5 transition-colors ${
              currentView === 'chart' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            <BarChartIcon className="w-3.5 h-3.5" />
            {t('reports.preview.chart')}
          </button>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            {totalRows > 0 ? t('reports.preview.total_rows', { count: totalRows }) : t('reports.preview.no_data_short')}
          </span>
          {onExport && (
            <Button size="sm" variant="outline" onClick={onExport} className="h-7 text-xs gap-1.5">
              <Download className="w-3.5 h-3.5" />
              CSV
            </Button>
          )}
        </div>
      </div>

      {/* Таблица */}
      {currentView === 'table' && (
        <div className="rounded-xl border border-border/60 bg-background shadow-sm overflow-hidden flex flex-col">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/50 border-b border-border/60">
                <TableRow className="hover:bg-transparent">
                  {visibleCols.map(col => (
                    <SortableTableHead
                      key={col.key}
                      label={col.label}
                      onSort={() => onSort?.(col.key)}
                      direction={sortConfig?.key === col.key ? sortConfig.direction : null}
                      width={columnWidths[col.key]}
                      onResize={(w) => onResizeColumn?.(col.key, w)}
                      className={col.align === 'right' ? 'text-right' : ''}
                      contentClassName={col.align === 'right' ? 'justify-end' : ''}
                    />
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-border/60">
                {data.map((row, rowIdx) => (
                  <tr key={rowIdx} className="hover:bg-muted/30 transition-colors group">
                    {visibleCols.map(col => (
                      <TableCell
                        key={col.key}
                        className={`py-3 text-sm group-hover:text-primary transition-colors ${
                          col.align === 'right' ? 'text-right' : ''
                        }`}
                        style={{ width: columnWidths[col.key] }}
                      >
                        {formatCell(row[col.key], col.type, col.key, t)}
                      </TableCell>
                    ))}
                  </tr>
                ))}
              </TableBody>
              <tfoot>
                <TableRow className="bg-muted/30 border-t border-border font-medium">
                  {visibleCols.map((col, idx) => {
                    const isNumeric = col.type === 'currency' || col.type === 'number';
                    
                    if (idx === 0) {
                      return (
                        <TableCell key={col.key} className="py-2.5 text-xs text-muted-foreground uppercase font-bold">
                          {t('reports.preview.total_avg')}
                        </TableCell>
                      );
                    }

                    if (!isNumeric) {
                      return <TableCell key={col.key} className="py-2.5 text-xs">—</TableCell>;
                    }

                    // Calculate sum and average of loaded rows
                    const values = data.map(row => Number(row[col.key] || 0)).filter(v => !isNaN(v));
                    const sum = values.reduce((sum, v) => sum + v, 0);
                    const avg = values.length > 0 ? sum / values.length : 0;

                    return (
                      <TableCell key={col.key} className={`py-2.5 text-xs ${col.align === 'right' ? 'text-right' : ''}`}>
                        <div className="space-y-0.5">
                          <div>
                            <span className="text-[10px] text-muted-foreground mr-1">{t('reports.preview.sum')}</span>
                            {col.type === 'currency' ? (
                              <span className="font-mono">{new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(sum)}</span>
                            ) : (
                              <span className="font-mono">{sum.toLocaleString('ru-RU')}</span>
                            )}
                          </div>
                          <div>
                            <span className="text-[10px] text-muted-foreground mr-1">{t('reports.preview.avg')}</span>
                            {col.type === 'currency' ? (
                              <span className="font-mono">{new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(avg)}</span>
                            ) : (
                              <span className="font-mono">{avg.toLocaleString('ru-RU', { maximumFractionDigits: 1 })}</span>
                            )}
                          </div>
                        </div>
                      </TableCell>
                    );
                  })}
                </TableRow>
              </tfoot>
            </Table>
          </div>
          <div className="bg-muted/20 border-t border-border/60">
            <TableFooterPagination
              currentPage={page}
              rowsPerPage={String(limit)}
              totalCount={totalRows}
              shownCount={data.length}
              onPageChange={onPageChange}
              onRowsPerPageChange={(v) => onLimitChange(Number(v))}
            />
          </div>
        </div>
      )}

      {/* Настройки графика */}
      {currentView === 'chart' && (
        <div className="flex gap-4 p-3.5 bg-muted/20 rounded-xl border flex-wrap items-center text-xs">
          <div className="flex items-center gap-1.5">
            <span className="text-muted-foreground font-medium">{t('reports.preview.chart_settings.chart_type')}</span>
            <select
              value={currentChartType}
              onChange={(e) => {
                const val = e.target.value as any;
                if (onChartTypeChange) onChartTypeChange(val);
                else setLocalChartType(val);
              }}
              className="bg-background border border-border/60 rounded px-2 py-1 h-7 cursor-pointer"
            >
              <option value="bar">{t('reports.preview.chart_settings.bar_chart')}</option>
              <option value="line">{t('reports.preview.chart_settings.line_chart')}</option>
              <option value="pie">{t('reports.preview.chart_settings.pie_chart')}</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-muted-foreground font-medium">{t('reports.preview.chart_settings.axis_x')}</span>
            <select
              value={resolvedLabelKey}
              onChange={(e) => {
                if (onChartLabelKeyChange) onChartLabelKeyChange(e.target.value);
                else setLocalLabelKey(e.target.value);
              }}
              className="bg-background border border-border/60 rounded px-2 py-1 h-7 cursor-pointer"
            >
              {visibleCols.map(c => (
                <option key={c.key} value={c.key}>{c.label}</option>
              ))}
            </select>
          </div>

          {resolvedValueKey && (
            <div className="flex items-center gap-1.5">
              <span className="text-muted-foreground font-medium">{t('reports.preview.chart_settings.axis_y')}</span>
              <select
                value={resolvedValueKey}
                onChange={(e) => {
                  if (onChartValueKeyChange) onChartValueKeyChange(e.target.value);
                  else setLocalValueKey(e.target.value);
                }}
                className="bg-background border border-border/60 rounded px-2 py-1 h-7 cursor-pointer"
              >
                {numCols.map(c => (
                  <option key={c.key} value={c.key}>{c.label}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      )}

      {/* Заглушка или график */}
      {currentView === 'chart' && chartConfig && (
        <>
          {currentChartType === 'bar' && (
            <div className="border rounded-lg p-8 bg-card h-[450px] shadow-sm">
              <ChartContainer config={chartConfig.config} className="h-full w-full">
                <BarChart data={data.slice(0, 15)} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" opacity={0.2} />
                  <XAxis
                    dataKey={chartConfig.labelKey}
                    tickLine={false}
                    tickMargin={12}
                    axisLine={false}
                    fontSize={11}
                    angle={-45}
                    textAnchor="end"
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    fontSize={11}
                    tickFormatter={(val) => val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}
                  />
                  <ChartTooltip 
                    cursor={{ fill: 'hsl(var(--muted)/0.3)' }}
                    content={<ChartTooltipContent hideLabel />} 
                  />
                  <Bar
                    dataKey={chartConfig.valueKey}
                    radius={[6, 6, 0, 0]}
                    maxBarSize={45}
                    animationDuration={1000}
                  >
                    {data.slice(0, 15).map((_, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={CHART_COLORS[index % CHART_COLORS.length]} 
                        className="hover:opacity-80 transition-all duration-300 cursor-pointer"
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ChartContainer>
              <p className="text-[11px] text-center text-muted-foreground mt-2 italic">
                {t('reports.preview.top_records_note')}
              </p>
            </div>
          )}

          {currentChartType === 'line' && (
            <div className="border rounded-lg p-8 bg-card h-[450px] shadow-sm">
              <ChartContainer config={chartConfig.config} className="h-full w-full">
                <LineChart data={data.slice(0, 15)} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" opacity={0.2} />
                  <XAxis
                    dataKey={chartConfig.labelKey}
                    tickLine={false}
                    tickMargin={12}
                    axisLine={false}
                    fontSize={11}
                    angle={-45}
                    textAnchor="end"
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    fontSize={11}
                    tickFormatter={(val) => val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}
                  />
                  <ChartTooltip 
                    cursor={{ stroke: 'hsl(var(--primary))', strokeWidth: 1 }}
                    content={<ChartTooltipContent hideLabel />} 
                  />
                  <Line
                    type="monotone"
                    dataKey={chartConfig.valueKey}
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={{ r: 4, strokeWidth: 2 }}
                    activeDot={{ r: 6 }}
                    animationDuration={1000}
                  />
                </LineChart>
              </ChartContainer>
              <p className="text-[11px] text-center text-muted-foreground mt-2 italic">
                {t('reports.preview.top_records_note')}
              </p>
            </div>
          )}

          {currentChartType === 'pie' && (
            <div className="border rounded-lg p-8 bg-card h-[450px] shadow-sm">
              <ChartContainer config={chartConfig.config} className="h-full w-full">
                <PieChart margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
                  <ChartTooltip 
                    cursor={{ fill: 'hsl(var(--muted)/0.3)' }}
                    content={<ChartTooltipContent hideLabel />} 
                  />
                  <Pie
                    data={data.slice(0, 15)}
                    dataKey={chartConfig.valueKey}
                    nameKey={chartConfig.labelKey}
                    cx="50%"
                    cy="45%"
                    outerRadius={100}
                    label={({ name, percent }) => `${name.substring(0, 12)} ${(percent * 100).toFixed(0)}%`}
                    labelLine={true}
                  >
                    {data.slice(0, 15).map((_, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={CHART_COLORS[index % CHART_COLORS.length]} 
                      />
                    ))}
                  </Pie>
                  <Legend verticalAlign="bottom" height={36} iconSize={8} wrapperStyle={{ fontSize: '10px' }} />
                </PieChart>
              </ChartContainer>
            </div>
          )}
        </>
      )}

      {currentView === 'chart' && !chartConfig && (
        <div className="border rounded-lg flex items-center justify-center py-16 text-muted-foreground">
          <div className="text-center">
            <BarChartIcon className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm">{t('reports.preview.chart_unavailable')}</p>
            <p className="text-xs mt-1">{t('reports.preview.chart_unavailable_desc')}</p>
          </div>
        </div>
      )}
    </div>
  );
}
