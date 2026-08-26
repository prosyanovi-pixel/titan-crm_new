// Query key factory for the finance module
export const financeKeys = {
  all: ['finance'] as const,
  invoices: () => [...financeKeys.all, 'invoices'] as const,
  invoiceList: (filters?: any) => [...financeKeys.invoices(), 'list', filters] as const,
  invoiceDetail: (id: string) => [...financeKeys.invoices(), 'detail', id] as const,
  
  payments: () => [...financeKeys.all, 'payments'] as const,
  paymentList: (filters?: any) => [...financeKeys.payments(), 'list', filters] as const,
  paymentDetail: (id: string) => [...financeKeys.payments(), 'detail', id] as const,
  
  debts: () => [...financeKeys.all, 'debts'] as const,
};
