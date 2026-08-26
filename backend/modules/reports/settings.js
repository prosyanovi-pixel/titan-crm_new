/**
 * Reports Module Settings
 */

module.exports = {
  display: {
    itemsPerPage: 25,
    previewLimit: 10,     // кол-во строк в предпросмотре конструктора
    defaultSort: 'createdAt',
    defaultView: 'table',
  },
  features: {
    enableSharedReports: true,
    enableExportCsv: true,
    enableExportXlsx: true,
    enableCharts: true,
  },
  cache: {
    ttlSeconds: 300,      // 5 минут для тяжёлых агрегирующих запросов
  },
  /** Допустимые типы отчётов */
  reportTypes: [
    'finance_pl',
    'finance_dds',
    'finance_receivables',
    'finance_register',
    'finance_taxes',
    'projects_summary',
    'projects_budget',
    'projects_stages',
    'tasks_workload',
    'tasks_overdue',
    'tasks_performance',
    'contractors_activity',
    'contractors_contracts',
    'contractors_demographics',
    'lawyers_performance',
    'lawyers_workload',
    'lawyers_billing',
    'custom',
  ],
};
