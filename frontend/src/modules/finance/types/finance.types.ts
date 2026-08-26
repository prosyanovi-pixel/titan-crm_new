export type InvoiceStatusType = 
  | 'draft' 
  | 'sent' 
  | 'partial_paid' 
  | 'paid' 
  | 'overdue';

export type InvoiceType = 'outgoing' | 'incoming';

export type ReconcileStatus = 'unmatched' | 'auto' | 'manual';

export type StatementDirection = 'credit' | 'debit';

export type PaymentKind = 'income' | 'expense';

export interface Invoice {
  id: number;
  identifier: string; // INV-2026-000012 — авто-генерируется бэкендом
  title: string;       // пользовательское название счёта
  invoiceType: InvoiceType; // 'outgoing' | 'incoming'
  contractorId: number | null;
  projectId: number | null;
  lawyerUserId: number | null;  // соответствует бэкенду
  lawyerId: number | null;      // алиас для обратной совместимости
  sourceTaskId: number | null;  // соответствует бэкенду
  taskId: number | null;        // алиас для обратной совместимости
  contractId?: number | null;
  amountTotal: number;
  amountPaid: number;
  amountDue: number;
  currency: string;
  status: InvoiceStatusType;
  description: string;
  issueDate: string; // ISO date
  dueDate: string; // ISO date
  calendarEventId: number | null;
  createdBy: string;
  updatedBy: string;
  createdAt: string; // ISO timestamp
  updatedAt: string; // ISO timestamp
  overdueSince?: string | null; // Дата просрочки
  isTaxable: boolean;
  vatRate: number;
  vatAmount: number;

  // Enriched fields (from JOINs)
  contractorName?: string;
  contractorLegalForm?: string;
  taxRegimeName?: string;
  projectName?: string;
  lawyerName?: string;
  taskTitle?: string;
}

export interface Payment {
  id: number;
  invoiceId: number | null;
  projectId: number | null;
  taskId: string | null;
  contractorId: number | null;
  categoryId: string | null;
  contractId?: number | null;
  campaignId?: string | null; // Привязка к маркетинговой кампании
  kind: PaymentKind; // 'income' or 'expense'
  amount: number;
  currency?: string;
  description?: string;
  comment?: string;
  paymentDate: string; // ISO date
  paymentMethod?: string; // способ оплаты (банк, наличные и т.д.)
  method?: string; // способ оплаты (альтернативное имя)
  paymentNumber?: string | null; // Номер платежного поручения
  createdBy: string;
  updatedBy: string;
  createdAt: string; // ISO timestamp
  updatedAt: string; // ISO timestamp

  // Enriched fields (from JOINs)
  invoiceIdentifier?: string; // Номер счета
  projectName?: string;
  taskTitle?: string;
  contractorName?: string;
  categoryName?: string;
  campaignName?: string; // Название кампании
}

export interface ExpenseCategory {
  id: string;
  name: string;
  kind: PaymentKind;
  parentId: string | null;
  color: string | null;
  isSystem: boolean;
  createdAt: string;
}

export interface BankStatement {
  id: string;
  fileName: string;
  importType: 'csv' | '1c_txt';
  account: string | null;
  dateFrom: string | null;
  dateTo: string | null;
  totalCredit: number;
  totalDebit: number;
  status: 'pending' | 'reconciled';
  importedBy: string | null;
  createdAt: string;
  // Новые поля для поддержки отката
  importSessionId?: string;
  isRolledBack?: boolean;
  rolledBackAt?: string;
  rolledBackBy?: string;
  rollbackReason?: string;
}

export interface StatementLine {
  id: string;
  statementId: string;
  lineDate: string;
  amount: number;
  direction: StatementDirection;
  counterparty: string | null;
  purpose: string | null;
  reference: string | null;
  invoiceId: string | null;
  paymentId: string | null;
  reconcileStatus: ReconcileStatus;
  createdAt: string;
  contractorId: number | null;
  counterpartyInn: string | null;
  // Enriched
  invoiceIdentifier?: string;
  paymentAmount?: number;
  categoryId: string | null;
  categoryName: string | null;
  categoryKind: string | null;
  categoryColor: string | null;
}

export interface DdsRow {
  kind: PaymentKind;
  categoryId: string;
  categoryName: string;
  categoryColor: string | null;
  total: number;
}

export interface PLReport {
  totalIncome: number;
  totalExpense: number;
  profit: number;
  byCategory: Array<{
    categoryId: string;
    categoryName: string;
    kind: PaymentKind;
    total: number;
  }>;
  payments: Payment[];
}

export interface ReconciliationAct {
  contractorId: string;
  contractorName: string;
  dateFrom: string | null;
  dateTo: string | null;
  totalInvoiced: number;
  totalPaid: number;
  balance: number;
  invoices: Array<{
    id: string;
    identifier: string;
    issueDate: string;
    dueDate: string;
    amountTotal: number;
    amountPaid: number;
    amountDue: number;
    status: InvoiceStatusType;
  }>;
  payments: Array<{
    id: string;
    paymentDate: string;
    amount: number;
    kind: PaymentKind;
    invoiceIdentifier: string | null;
    comment: string | null;
  }>;
}

export interface InvoiceDocument {
  id: number;
  invoiceId: number;
  documentId: number;
  documentType: 'act' | 'invoice'; // act, invoice, etc.
  templatePayload: Record<string, unknown>; // JSON snapshot
  createdAt: string; // ISO timestamp
}

export interface InvoiceStatus {
  id: string;
  name: string;
  color: string;
  module: 'finance';
}

export interface ProjectFinanceSummary {
  projectId: number;
  totalInvoiced: number;
  totalPaid: number;
  totalExpenses: number;
  openReceivables: number;
  profitLoss: number;
}

export interface ReceivablesReport {
  contractorId?: number;
  contractorName?: string;
  projectId?: number;
  projectName?: string;
  totalInvoiced: number;
  totalPaid: number;
  totalDue: number;
  overdueCount: number;
  maxOverdueDays: number;
  invoices: Invoice[];
}

export interface CalendarPayment {
  id: number;
  kind: PaymentKind;
  amount: number;
  paymentDate: string; // ISO date
  description: string;
  isUpcoming: boolean; // true if payment is due within week/month
}
