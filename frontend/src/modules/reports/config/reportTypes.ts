/**
 * Метаданные всех типов отчётов — единый источник истины для конструктора.
 * Используется для рендеринга шагов выбора, фильтров и колонок.
 */

import type { ReportTypeMeta } from '../types/reports.types';

export const REPORT_TYPES_META: ReportTypeMeta[] = [
  // ── ФИНАНСЫ ──────────────────────────────────────────────────────────────
  {
    type: 'finance_register',
    module: 'finance',
    label: 'reports.finance_register_label',
    description: 'reports.finance_register_description',
    icon: 'FileText',
    columns: [
      { key: 'paymentDate',        label: 'common.date',         type: 'date',     sortable: true },
      { key: 'kind',               label: 'common.type',          type: 'badge' },
      { key: 'contractorName',     label: 'common.contractor',   type: 'text' },
      { key: 'categoryName',       label: 'common.category',       type: 'text' },
      { key: 'projectName',        label: 'common.project',       type: 'text' },
      { key: 'invoiceIdentifier',  label: 'common.invoice',         type: 'text' },
      { key: 'amount',             label: 'common.amount',        type: 'currency', sortable: true, align: 'right' },
      { key: 'comment',            label: 'common.description',  type: 'text' },
    ],
    defaultCols: ['paymentDate', 'kind', 'contractorName', 'categoryName', 'amount'],
    filterFields: [
      { key: 'dateFrom',     label: 'Дата с',       inputType: 'date' },
      { key: 'dateTo',       label: 'Дата по',      inputType: 'date' },
      { key: 'kind',         label: 'Тип',          inputType: 'select',  optionsKey: 'paymentKinds' },
      { key: 'contractorId', label: 'Контрагент',   inputType: 'select',  optionsKey: 'contractors' },
      { key: 'projectId',    label: 'Проект',       inputType: 'select',  optionsKey: 'projects' },
    ],
  },
  {
    type: 'finance_pl',
    module: 'finance',
    label: 'reports.finance_pl_label',
    description: 'reports.finance_pl_description',
    icon: 'TrendingUp',
    columns: [
      { key: 'categoryName', label: 'common.category',     type: 'text' },
      { key: 'kind',         label: 'common.type',        type: 'badge' },
      { key: 'total',        label: 'common.amount',      type: 'currency', sortable: true, align: 'right' },
    ],
    defaultCols: ['categoryName', 'kind', 'total'],
    filterFields: [
      { key: 'dateFrom',  label: 'Дата с',   inputType: 'date' },
      { key: 'dateTo',    label: 'Дата по',  inputType: 'date' },
      { key: 'projectId', label: 'Проект',   inputType: 'select', optionsKey: 'projects' },
    ],
  },
  {
    type: 'finance_dds',
    module: 'finance',
    label: 'reports.finance_dds_label',
    description: 'reports.finance_dds_description',
    icon: 'BarChart2',
    columns: [
      { key: 'kind',          label: 'common.type',        type: 'badge' },
      { key: 'categoryName',  label: 'common.category',     type: 'text' },
      { key: 'total',         label: 'common.amount',      type: 'currency', sortable: true, align: 'right' },
    ],
    defaultCols: ['kind', 'categoryName', 'total'],
    filterFields: [
      { key: 'dateFrom', label: 'Дата с',  inputType: 'date' },
      { key: 'dateTo',   label: 'Дата по', inputType: 'date' },
    ],
  },
  {
    type: 'finance_receivables',
    module: 'finance',
    label: 'reports.finance_receivables_label',
    description: 'reports.finance_receivables_description',
    icon: 'AlertCircle',
    columns: [
      { key: 'contractorName', label: 'common.contractor', type: 'text' },
      { key: 'projectName',    label: 'common.project',     type: 'text' },
      { key: 'identifier',     label: 'common.invoice',       type: 'text' },
      { key: 'amountDue',      label: 'common.debt',       type: 'currency', sortable: true, align: 'right' },
      { key: 'dueDate',        label: 'common.term',       type: 'date',     sortable: true },
      { key: 'isOverdue',      label: 'common.overdue',  type: 'badge' },
    ],
    defaultCols: ['contractorName', 'amountDue', 'dueDate', 'isOverdue'],
    filterFields: [],
  },
  {
    type: 'finance_taxes',
    module: 'finance',
    label: 'reports.finance_taxes_label',
    description: 'reports.finance_taxes_description',
    icon: 'Calculator',
    columns: [
      { key: 'period',       label: 'common.period',     type: 'text' },
      { key: 'taxBase',      label: 'common.base',       type: 'currency', align: 'right' },
      { key: 'taxAmount',    label: 'common.tax',      type: 'currency', align: 'right' },
      { key: 'status',       label: 'common.status',     type: 'badge' },
    ],
    defaultCols: ['period', 'taxBase', 'taxAmount', 'status'],
    filterFields: [
      { key: 'dateFrom', label: 'Дата с',  inputType: 'date' },
      { key: 'dateTo',   label: 'Дата по', inputType: 'date' },
    ],
  },

  // ── ПРОЕКТЫ ─────────────────────────────────────────────────────────────
  {
    type: 'projects_summary',
    module: 'projects',
    label: 'reports.projects_summary_label',
    description: 'reports.projects_summary_description',
    icon: 'FolderKanban',
    columns: [
      { key: 'name',           label: 'common.project',     type: 'text' },
      { key: 'status',         label: 'common.status',     type: 'badge' },
      { key: 'managerName',    label: 'common.manager',   type: 'text' },
      { key: 'contractorName', label: 'common.contractor', type: 'text' },
      { key: 'tags',           label: 'common.tags',       type: 'text' },
      { key: 'tasksTotal',     label: 'common.total_tasks',      type: 'number', align: 'right' },
      { key: 'tasksDone',      label: 'common.completed',  type: 'number', align: 'right' },
      { key: 'totalIncome',    label: 'common.income',      type: 'currency', align: 'right' },
      { key: 'totalExpense',   label: 'common.expense',     type: 'currency', align: 'right' },
      { key: 'deadline',       label: 'common.deadline',    type: 'date' },
    ],
    defaultCols: ['name', 'status', 'managerName', 'tasksTotal', 'tasksDone', 'totalIncome'],
    filterFields: [
      { key: 'status', label: 'Статус', inputType: 'text' },
    ],
  },
  {
    type: 'projects_budget',
    module: 'projects',
    label: 'reports.projects_budget_label',
    description: 'reports.projects_budget_description',
    icon: 'PieChart',
    columns: [
      { key: 'name',          label: 'common.project',    type: 'text' },
      { key: 'budget',        label: 'common.plan',      type: 'currency', align: 'right' },
      { key: 'totalIncome',   label: 'common.fact',      type: 'currency', align: 'right' },
      { key: 'variance',      label: 'common.deviation', type: 'currency', align: 'right' },
      { key: 'usagePercent',  label: 'common.usage_percent',         type: 'number', align: 'right' },
    ],
    defaultCols: ['name', 'budget', 'totalIncome', 'variance', 'usagePercent'],
    filterFields: [
      { key: 'projectId', label: 'Проект', inputType: 'select', optionsKey: 'projects' },
    ],
  },
  {
    type: 'projects_stages',
    module: 'projects',
    label: 'reports.projects_stages_label',
    description: 'reports.projects_stages_description',
    icon: 'Layers',
    columns: [
      { key: 'projectName',  label: 'common.project',   type: 'text' },
      { key: 'stageName',    label: 'common.stage',     type: 'text' },
      { key: 'status',       label: 'common.status',    type: 'badge' },
      { key: 'tasksCount',   label: 'common.total_tasks',    type: 'number', align: 'right' },
    ],
    defaultCols: ['projectName', 'stageName', 'status', 'tasksCount'],
    filterFields: [
      { key: 'projectId', label: 'Проект', inputType: 'select', optionsKey: 'projects' },
    ],
  },

  // ── ЗАДАЧИ ──────────────────────────────────────────────────────────────
  {
    type: 'tasks_workload',
    module: 'tasks',
    label: 'reports.tasks_workload_label',
    description: 'reports.tasks_workload_description',
    icon: 'UserCheck',
    columns: [
      { key: 'assigneeName', label: 'common.employee', type: 'text' },
      { key: 'activeTasks',  label: 'common.in_progress',  type: 'number', align: 'right' },
      { key: 'pendingTasks', label: 'common.pending',   type: 'number', align: 'right' },
      { key: 'totalTasks',   label: 'common.total',     type: 'number', align: 'right' },
    ],
    defaultCols: ['assigneeName', 'activeTasks', 'totalTasks'],
    filterFields: [],
  },
  {
    type: 'tasks_overdue',
    module: 'tasks',
    label: 'reports.tasks_overdue_label',
    description: 'reports.tasks_overdue_description',
    icon: 'Clock',
    columns: [
      { key: 'title',        label: 'common.task',    type: 'text' },
      { key: 'projectName',  label: 'common.project',    type: 'text' },
      { key: 'assigneeName', label: 'common.assignee', type: 'text' },
      { key: 'dueDate',      label: 'common.term',      type: 'date' },
      { key: 'daysOverdue',  label: 'common.days',      type: 'number', align: 'right' },
    ],
    defaultCols: ['title', 'assigneeName', 'dueDate', 'daysOverdue'],
    filterFields: [
      { key: 'projectId', label: 'Проект', inputType: 'select', optionsKey: 'projects' },
    ],
  },

  // ── КОНТРАГЕНТЫ ─────────────────────────────────────────────────────────
  {
    type: 'contractors_activity',
    module: 'contractors',
    label: 'reports.contractors_activity_label',
    description: 'reports.contractors_activity_description',
    icon: 'Users',
    columns: [
      { key: 'name',           label: 'common.contractor',   type: 'text' },
      { key: 'inn',            label: 'common.inn',          type: 'text' },
      { key: 'tags',           label: 'common.tags',          type: 'text' },
      { key: 'projectsCount',  label: 'common.projects_count',     type: 'number', align: 'right' },
      { key: 'paymentsCount',  label: 'common.payments_count',     type: 'number', align: 'right' },
      { key: 'totalIncome',    label: 'common.income',        type: 'currency', sortable: true, align: 'right' },
      { key: 'lastPaymentDate',label: 'common.last_payment', type: 'date' },
    ],
    defaultCols: ['name', 'projectsCount', 'paymentsCount', 'totalIncome'],
    filterFields: [
      { key: 'dateFrom', label: 'Дата с',  inputType: 'date' },
      { key: 'dateTo',   label: 'Дата по', inputType: 'date' },
    ],
  },
  {
    type: 'contractors_dossier',
    module: 'contractors',
    label: 'reports.contractors_dossier_label',
    description: 'reports.contractors_dossier_description',
    icon: 'FileText',
    columns: [
      { key: 'entityName',     label: 'Объект/Название', type: 'text' },
      { key: 'entityType',     label: 'Тип данных',      type: 'badge' },
      { key: 'status',         label: 'Статус',          type: 'badge' },
      { key: 'amount',         label: 'Сумма/Бюджет',    type: 'currency', align: 'right' },
      { key: 'date',           label: 'Дата/Срок',       type: 'date' },
      { key: 'assignee',       label: 'Ответственный',   type: 'text' },
    ],
    defaultCols: ['entityName', 'entityType', 'status', 'amount', 'date'],
    filterFields: [
      { key: 'contractorId', label: 'Контрагент',   inputType: 'select', optionsKey: 'contractors' },
    ],
  },
  {
    type: 'contractors_contracts',
    module: 'contractors',
    label: 'reports.contractors_contracts_label',
    description: 'reports.contractors_contracts_description',
    icon: 'FileSignature',
    columns: [
      { key: 'contractNumber', label: '№ Договора', type: 'text' },
      { key: 'contractorName', label: 'Контрагент', type: 'text' },
      { key: 'status',         label: 'Статус',     type: 'badge' },
      { key: 'startDate',      label: 'Начало',     type: 'date' },
      { key: 'endDate',        label: 'Окончание',   type: 'date' },
      { key: 'amount',         label: 'Сумма',      type: 'currency', align: 'right' },
    ],
    defaultCols: ['contractNumber', 'contractorName', 'status', 'endDate'],
    filterFields: [
      { key: 'contractorId', label: 'Контрагент', inputType: 'select', optionsKey: 'contractors' },
    ],
  },

  // ── ЮРИСТЫ ─────────────────────────────────────────────────────────────
  {
    type: 'lawyers_performance',
    module: 'lawyers',
    label: 'reports.lawyers_performance_label',
    description: 'reports.lawyers_performance_description',
    icon: 'Scale',
    columns: [
      { key: 'fullName',       label: 'Юрист',        type: 'text' },
      { key: 'specialization', label: 'Специализация', type: 'text' },
      { key: 'casesTotal',     label: 'Дел всего',    type: 'number', align: 'right' },
      { key: 'casesClosed',    label: 'Закрыто',      type: 'number', align: 'right' },
      { key: 'casesWon',       label: 'Выиграно',     type: 'number', align: 'right' },
      { key: 'casesLost',      label: 'Проиграно',    type: 'number', align: 'right' },
      { key: 'winRate',        label: 'Win Rate',     type: 'number', sortable: true, align: 'right' },
    ],
    defaultCols: ['fullName', 'specialization', 'casesTotal', 'casesWon', 'winRate'],
    filterFields: [
      { key: 'dateFrom', label: 'Дата с',  inputType: 'date' },
      { key: 'dateTo',   label: 'Дата по', inputType: 'date' },
    ],
  },
  {
    type: 'lawyers_workload',
    module: 'lawyers',
    label: 'reports.lawyers_workload_label',
    description: 'reports.lawyers_workload_description',
    icon: 'Gavel',
    columns: [
      { key: 'fullName',     label: 'Юрист',      type: 'text' },
      { key: 'activeCases',  label: 'Активных дел', type: 'number', align: 'right' },
      { key: 'hearingsSoon', label: 'Заседаний',  type: 'number', align: 'right' },
    ],
    defaultCols: ['fullName', 'activeCases', 'hearingsSoon'],
    filterFields: [],
  },

  // ── МАРКЕТИНГ ─────────────────────────────────────────────────────────────
  {
    type: 'marketing_campaigns',
    module: 'marketing',
    label: 'reports.marketing_campaigns_label',
    description: 'reports.marketing_campaigns_description',
    icon: 'Megaphone',
    columns: [
      { key: 'name',           label: 'Кампания',      type: 'text' },
      { key: 'status',         label: 'Статус',        type: 'badge' },
      { key: 'type',           label: 'Тип',           type: 'badge' },
      { key: 'budget',         label: 'Бюджет',        type: 'currency', align: 'right' },
      { key: 'actualCost',     label: 'Фактический расход', type: 'currency', align: 'right' },
      { key: 'targetAudience', label: 'Аудитория',     type: 'text' },
      { key: 'startDate',      label: 'Начало',        type: 'date' },
      { key: 'endDate',        label: 'Окончание',     type: 'date' },
    ],
    defaultCols: ['name', 'status', 'type', 'budget', 'actualCost'],
    filterFields: [
      { key: 'dateFrom', label: 'Дата с',  inputType: 'date' },
      { key: 'dateTo',   label: 'Дата по', inputType: 'date' },
      { key: 'status',   label: 'Статус',  inputType: 'text' },
      { key: 'type',     label: 'Тип',     inputType: 'text' },
    ],
  },

  // ── СВОЙ ОТЧЁТ ──────────────────────────────────────────────────────────
  {
    type: 'custom',
    module: 'custom',
    label: 'reports.custom_label',
    description: 'reports.custom_description',
    icon: 'Settings2',
    columns: [
      { key: 'name',         label: 'Название/ФИО', type: 'text' },
      { key: 'status',       label: 'Статус',       type: 'badge' },
      { key: 'amount',       label: 'Сумма',        type: 'currency' },
      { key: 'date',         label: 'Дата',         type: 'date' },
      { key: 'assignedTo',   label: 'Ответственный', type: 'text' },
    ],
    defaultCols: ['name', 'status', 'amount', 'date'],
    filterFields: [
      { key: 'sourceEntity', label: 'Источник данных', inputType: 'select', optionsKey: 'entities' as any },
      {
        key: 'groupBy',
        label: 'Группировать по',
        inputType: 'select',
        options: [
          { value: '', label: 'Без группировки' },
          { value: 'status', label: 'Статусу' },
          { value: 'project', label: 'Проекту' },
          { value: 'contractor', label: 'Контрагенту' },
          { value: 'kind', label: 'Типу операции' },
        ],
      },
      { key: 'dateFrom',     label: 'Дата с',       inputType: 'date' },
      { key: 'dateTo',       label: 'Дата по',      inputType: 'date' },
    ],
  },
];

/** Найти метаданные по типу отчёта */
export const getReportTypeMeta = (type: string): ReportTypeMeta | undefined =>
  REPORT_TYPES_META.find(m => m.type === type);
