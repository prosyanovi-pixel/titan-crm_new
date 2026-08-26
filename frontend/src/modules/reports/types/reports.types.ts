/**
 * TypeScript интерфейсы и типы модуля Reports
 */

/** Допустимые типы отчётов */
export type ReportType =
  | 'finance_pl'
  | 'finance_dds'
  | 'finance_receivables'
  | 'finance_register'
  | 'finance_taxes'
  | 'projects_summary'
  | 'projects_budget'
  | 'projects_stages'
  | 'tasks_workload'
  | 'tasks_overdue'
  | 'tasks_performance'
  | 'contractors_activity'
  | 'contractors_contracts'
  | 'contractors_dossier'
  | 'contractors_demographics'
  | 'lawyers_performance'
  | 'lawyers_workload'
  | 'lawyers_billing'
  | 'marketing_campaigns'
  | 'custom';

/** Модули системы для группировки отчётов */
export type ReportModule = 'finance' | 'projects' | 'tasks' | 'contractors' | 'lawyers' | 'marketing' | 'custom';

export interface FilterRule {
  field: string;
  operator: '=' | '>' | '<' | '>=' | '<=' | 'like' | 'is_null' | 'is_not_null';
  value: string;
}

/** Тип визуализации */
export type ChartType = 'bar' | 'line' | 'pie' | 'table';

/** Фильтры отчёта */
export interface ReportFilters {
  dateFrom?:      string;
  dateTo?:        string;
  projectId?:     number | string;
  contractorId?:  number | string;
  lawyerId?:      number | string;
  groupBy?:       string;
  kind?:          'income' | 'expense';
  rules?:         FilterRule[];
  chartLabelKey?: string;
  chartValueKey?: string;
  [key: string]:  unknown;
}

/** Сохранённая конфигурация отчёта */
export interface ReportConfig {
  id:              string;
  name:            string;
  description?:    string;
  reportType:      ReportType;
  filters:         ReportFilters;
  columns:         string[];
  status?:         string;
  chartType?:      ChartType;
  isShared:        boolean;
  createdBy:       string;
  createdByName?:  string;
  createdAt:       string;
  updatedAt:       string;
}

/** Форма создания / редактирования конфигурации */
export type ReportConfigFormData = Omit<ReportConfig, 'id' | 'createdBy' | 'createdByName' | 'createdAt' | 'updatedAt'>;

/** Предпросмотр данных отчёта */
export interface ReportPreviewData {
  data:      Record<string, unknown>[];
  totalRows: number;
}

/** Ответ GET /configs/:id */
export interface ReportConfigWithPreview {
  config:  ReportConfig;
  preview: ReportPreviewData;
}

/** Определение колонки отчёта */
export interface ReportColumnDef {
  key:       string;
  label:     string;
  type:      'text' | 'number' | 'date' | 'badge' | 'currency';
  sortable?: boolean;
  align?:    'left' | 'right' | 'center';
}

/** Тип поля фильтра */
export type FilterInputType = 'date' | 'select' | 'text';

/** Определение поля фильтра */
export interface ReportFilterField {
  key:        string;
  label:      string;
  inputType:  FilterInputType;
  optionsKey?: 'projects' | 'contractors' | 'lawyers' | 'paymentKinds' | 'users' | 'managers';
  options?:    Array<{ value: string; label: string }>;
}

/** Метаданные типа отчёта */
export interface ReportTypeMeta {
  type:         ReportType;
  module:       ReportModule;
  label:        string;
  description:  string;
  icon:         string;
  columns:      ReportColumnDef[];
  defaultCols:  string[];
  filterFields: ReportFilterField[];
}
