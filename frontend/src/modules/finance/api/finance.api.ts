import { api } from '@/lib/api';
import {
  Invoice, Payment, ProjectFinanceSummary, ReceivablesReport, CalendarPayment,
  ExpenseCategory, BankStatement, StatementLine, DdsRow, PLReport, ReconciliationAct,
} from '../types/finance.types';

export const financeApi = {
  // Invoices
  getInvoices: async (filters?: {
    status?: string;
    invoiceType?: 'outgoing' | 'incoming';
    contractorId?: number;
    projectId?: number;
    lawyerId?: number;
    startDate?: string;
    endDate?: string;
    overdueOnly?: boolean;
  }) => {
    const params = new URLSearchParams();
    if (filters?.status) params.set('status', filters.status);
    if (filters?.invoiceType) params.set('invoiceType', filters.invoiceType);
    if (filters?.contractorId) params.set('contractorId', String(filters.contractorId));
    if (filters?.projectId) params.set('projectId', String(filters.projectId));
    if (filters?.lawyerId) params.set('lawyerId', String(filters.lawyerId));
    if (filters?.startDate) params.set('startDate', filters.startDate);
    if (filters?.endDate) params.set('endDate', filters.endDate);
    if (filters?.overdueOnly) params.set('overdueOnly', 'true');

    return api.get(`/finance/invoices?${params.toString()}`) as Promise<Invoice[]>;
  },

  getInvoice: async (id: number) => {
    return api.get(`/finance/invoices/${id}`) as Promise<Invoice>;
  },

  createInvoice: async (data: Partial<Invoice>) => {
    return api.post('/finance/invoices', data) as Promise<Invoice>;
  },

  updateInvoice: async (id: number, data: Partial<Invoice>) => {
    return api.put(`/finance/invoices/${id}`, data) as Promise<Invoice>;
  },

  deleteInvoice: async (id: string | number) => {
    return api.delete(`/finance/invoices/${id}`);
  },

  sendInvoice: async (id: number) => {
    return api.post(`/finance/invoices/${id}/send`, {}) as Promise<Invoice>;
  },

  recalculateInvoiceStatus: async (id: number) => {
    return api.post(`/finance/invoices/${id}/recalculate-status`, {}) as Promise<Invoice>;
  },

  generateInvoiceDocument: async (id: number, data: { documentType: 'act' | 'invoice' }) => {
    return api.post(`/finance/invoices/${id}/generate-document`, data) as Promise<{ documentId: number }>;
  },

  // Payments
  getPayments: async (filters?: {
    kind?: 'income' | 'expense';
    invoiceId?: number;
    projectId?: number;
    taskId?: string;
    contractorId?: number;
    categoryId?: string;
    startDate?: string;
    endDate?: string;
  }) => {
    const params = new URLSearchParams();
    if (filters?.kind) params.set('kind', filters.kind);
    if (filters?.invoiceId) params.set('invoiceId', String(filters.invoiceId));
    if (filters?.projectId) params.set('projectId', String(filters.projectId));
    if (filters?.taskId) params.set('taskId', filters.taskId);
    if (filters?.contractorId) params.set('contractorId', String(filters.contractorId));
    if (filters?.categoryId) params.set('categoryId', filters.categoryId);
    if (filters?.startDate) params.set('startDate', filters.startDate);
    if (filters?.endDate) params.set('endDate', filters.endDate);

    return api.get(`/finance/payments?${params.toString()}`) as Promise<Payment[]>;
  },

  createPayment: async (data: Partial<Payment>) => {
    return api.post('/finance/payments', data) as Promise<Payment>;
  },

  updatePayment: async (id: number, data: Partial<Payment>) => {
    return api.put(`/finance/payments/${id}`, data) as Promise<Payment>;
  },

  deletePayment: async (id: number) => {
    return api.delete(`/finance/payments/${id}`);
  },

  /**
   * Отвязать платеж от счета
   * @param paymentId - ID платежа
   * @returns ID счета для которого был пересчитан статус
   */
  unlinkPaymentFromInvoice: async (id: number | string) => {
    return api.post(`/finance/payments/${id}/unlink-from-invoice`, {}) as Promise<{
      success: boolean;
      previousInvoiceId?: number | string;
      message: string;
    }>;
  },

  // Expense categories (DDS)
  getCategories: async (kind?: 'income' | 'expense') => {
    const params = kind ? `?kind=${kind}` : '';
    return api.get(`/finance/categories${params}`) as Promise<ExpenseCategory[]>;
  },

  createCategory: async (data: { name: string; kind: 'income' | 'expense'; parentId?: string; color?: string }) => {
    return api.post('/finance/categories', data) as Promise<ExpenseCategory>;
  },

  updateCategory: async (id: string, data: Partial<ExpenseCategory>) => {
    return api.put(`/finance/categories/${id}`, data) as Promise<ExpenseCategory>;
  },

  deleteCategory: async (id: string) => {
    return api.delete(`/finance/categories/${id}`);
  },

  // Bank statements
  getStatements: async () => {
    return api.get('/finance/statements') as Promise<BankStatement[]>;
  },

  getStatementLines: async (id: string) => {
    return api.get(`/finance/statements/${id}/lines`) as Promise<StatementLine[]>;
  },

  importStatement: async (data: {
    content: string;
    fileName: string;
    importType: 'csv' | '1c_txt';
    account?: string;
    draft?: boolean; // Предпросмотр без записи в БД
  }) => {
    return api.post('/finance/statements/import', data) as Promise<{
      mode: 'preview' | 'imported';
      statementId?: string;
      linesCount: number;
      totalCredit: number;
      totalDebit: number;
      contractorsCreated?: number;
      contractorsUpdated?: number;
      newAccountsAdded?: number;
      paymentsCreated?: number;
      duplicatesSkipped?: number;
      warningsCount?: number;
      preview?: {
        fileName: string;
        importType: string;
        account: string | null;
        dateFrom: string | null;
        dateTo: string | null;
        totalCredit: number;
        totalDebit: number;
        linesCount: number;
        lines: any[];
        summary: {
          incomeCount: number;
          expenseCount: number;
          uniqueContractors: number;
        };
      };
      report?: {
        summary: any;
        contractors: any;
        newContractors: any[];
        updatedContractors: any[];
        newAccounts: any[];
        warnings: any[];
        suggestions: string[];
      };
    }>;
  },

  confirmImport: async (data: {
    content: string;
    fileName: string;
    importType: 'csv' | '1c_txt';
    account?: string;
  }) => {
    return api.post('/finance/statements/import', { ...data, draft: false }) as Promise<{
      statementId: string;
      linesCount: number;
      totalCredit: number;
      totalDebit: number;
      contractorsCreated: number;
      contractorsUpdated: number;
      newAccountsAdded: number;
      paymentsCreated: number;
      duplicatesSkipped: number;
      warningsCount: number;
      report: any;
    }>;
  },

  rollbackImport: async (sessionId: string, options?: {
    removeContractors?: boolean;
    reason?: string;
  }) => {
    return api.post('/finance/import/rollback', {
      sessionId,
      ...options,
    }) as Promise<{ success: boolean; steps: string[] }>;
  },

  reconcileStatement: async (id: string, account?: string) => {
    return api.post(`/finance/statements/${id}/reconcile`, { account }) as Promise<{ 
      matched: number; 
      total: number; 
    }>;
  },

  updateStatementLine: async (lineId: string, data: { invoiceId?: string; paymentId?: string; categoryId?: string | null }) => {
    return api.put(`/finance/statements/lines/${lineId}`, data) as Promise<StatementLine>;
  },

  assignStatementLine: async (lineId: string, data: { invoiceId?: string; paymentId?: string; categoryId?: string | null }) => {
    return api.post(`/finance/statements/lines/${lineId}/assign`, data) as Promise<StatementLine>;
  },

  deleteStatement: async (id: string) => {
    return api.delete(`/finance/statements/${id}`);
  },

  // Reports & Analytics
  getProjectSummary: async (projectId: number) => {
    return api.get(`/finance/projects/${projectId}/summary`) as Promise<ProjectFinanceSummary>;
  },

  getReceivablesReport: async (groupBy?: 'contractor' | 'project') => {
    const params = groupBy ? `?groupBy=${groupBy}` : '';
    return api.get(`/finance/reports/receivables${params}`) as Promise<ReceivablesReport[]>;
  },

  getCalendarPayments: async (period?: 'week' | 'month') => {
    const params = period ? `?period=${period}` : '';
    return api.get(`/finance/calendar-payments${params}`) as Promise<CalendarPayment[]>;
  },

  getPLReport: async (filters?: { projectId?: number; dateFrom?: string; dateTo?: string; categoryId?: string }) => {
    const params = new URLSearchParams();
    if (filters?.projectId) params.set('projectId', String(filters.projectId));
    if (filters?.dateFrom) params.set('dateFrom', filters.dateFrom);
    if (filters?.dateTo) params.set('dateTo', filters.dateTo);
    if (filters?.categoryId) params.set('categoryId', filters.categoryId);
    return api.get(`/finance/reports/pl?${params.toString()}`) as Promise<PLReport>;
  },

  getDDSReport: async (filters?: { dateFrom?: string; dateTo?: string }) => {
    const params = new URLSearchParams();
    if (filters?.dateFrom) params.set('dateFrom', filters.dateFrom);
    if (filters?.dateTo) params.set('dateTo', filters.dateTo);
    return api.get(`/finance/reports/dds?${params.toString()}`) as Promise<DdsRow[]>;
  },

  getPaymentRegister: async (filters?: {
    kind?: 'income' | 'expense';
    projectId?: number;
    contractorId?: number;
    categoryId?: string;
    dateFrom?: string;
    dateTo?: string;
  }) => {
    const params = new URLSearchParams();
    if (filters?.kind) params.set('kind', filters.kind);
    if (filters?.projectId) params.set('projectId', String(filters.projectId));
    if (filters?.contractorId) params.set('contractorId', String(filters.contractorId));
    if (filters?.categoryId) params.set('categoryId', filters.categoryId);
    if (filters?.dateFrom) params.set('dateFrom', filters.dateFrom);
    if (filters?.dateTo) params.set('dateTo', filters.dateTo);
    return api.get(`/finance/reports/register?${params.toString()}`) as Promise<Payment[]>;
  },

  getReconciliationAct: async (contractorId: number | string, filters?: { dateFrom?: string; dateTo?: string }) => {
    const params = new URLSearchParams();
    if (filters?.dateFrom) params.set('dateFrom', filters.dateFrom);
    if (filters?.dateTo) params.set('dateTo', filters.dateTo);
    return api.get(`/finance/reconciliation-act/${contractorId}?${params.toString()}`) as Promise<ReconciliationAct>;
  },
};
