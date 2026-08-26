import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { financeApi } from '../api/finance.api';
import { financeKeys } from '../api/finance.keys';
import axios from 'axios';
import {
  Invoice, Payment, ProjectFinanceSummary, ReceivablesReport, CalendarPayment,
  ExpenseCategory, BankStatement, StatementLine, DdsRow, PLReport, ReconciliationAct,
} from '../types/finance.types';
import { toast } from 'sonner';
import { useTranslation } from '@/lib/i18n';

export function useInvoices(filters?: Parameters<typeof financeApi.getInvoices>[0]) {
  return useQuery({
    queryKey: financeKeys.invoiceList(filters),
    queryFn: () => financeApi.getInvoices(filters),
  });
}

export function useInvoice(id: number) {
  return useQuery({
    queryKey: financeKeys.invoiceDetail(id.toString()),
    queryFn: () => financeApi.getInvoice(id),
    enabled: !!id,
  });
}

export function useCreateInvoice() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: (data: Partial<Invoice>) => financeApi.createInvoice(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: financeKeys.invoices() });
      toast.success(t('finance.message.invoice_created'));
    },
    onError: (error: unknown) => {
      toast.error(t('finance.message.error_creating_invoice'), { 
        description: (axios.isAxiosError(error) ? error.response?.data?.message || error.message : (error as Error)?.message) || t('finance.message.try_again_later')
      });
    },
  });
}

export function useUpdateInvoice(id: number) {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: (data: Partial<Invoice>) => financeApi.updateInvoice(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: financeKeys.invoiceDetail(id.toString()) });
      queryClient.invalidateQueries({ queryKey: financeKeys.invoices() });
      toast.success(t('finance.message.invoice_updated'));
    },
    onError: (error: unknown) => {
      toast.error(t('finance.message.error_updating_invoice'), { 
        description: (axios.isAxiosError(error) ? error.response?.data?.message || error.message : (error as Error)?.message) || t('finance.message.try_again_later')
      });
    },
  });
}

export function useSendInvoice(id: number) {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: () => financeApi.sendInvoice(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: financeKeys.invoiceDetail(id.toString()) });
      queryClient.invalidateQueries({ queryKey: financeKeys.invoices() });
      toast.success(t('finance.message.invoice_sent'));
    },
    onError: (error: unknown) => {
      toast.error(t('finance.message.error_sending_invoice'), { 
        description: (axios.isAxiosError(error) ? error.response?.data?.message || error.message : (error as Error)?.message) || t('finance.message.try_again_later')
      });
    },
  });
}

export function useGenerateInvoiceDocument(id: number) {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: (data: { documentType: 'act' | 'invoice' }) => financeApi.generateInvoiceDocument(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: financeKeys.invoiceDetail(id.toString()) });
      toast.success(t('finance.message.document_generated_success'));
    },
    onError: (error: unknown) => {
      toast.error(t('finance.message.document_generate_error'), { 
        description: (axios.isAxiosError(error) ? error.response?.data?.message || error.message : (error as Error)?.message) || t('finance.message.try_again_later')
      });
    },
  });
}

export function useDeleteInvoice() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: (id: string | number) => financeApi.deleteInvoice(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: financeKeys.invoices() });
      toast.success(t('finance.message.invoice_deleted'));
    },
    onError: (error: unknown) => {
      toast.error(t('finance.message.error_deleting_invoice'), { 
        description: (axios.isAxiosError(error) ? error.response?.data?.message || error.message : (error as Error)?.message) || t('finance.message.try_again_later')
      });
    },
  });
}

export function usePayments(filters?: Parameters<typeof financeApi.getPayments>[0]) {
  return useQuery({
    queryKey: financeKeys.paymentList(filters),
    queryFn: () => financeApi.getPayments(filters),
  });
}

export function useCreatePayment() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: (data: Partial<Payment>) => financeApi.createPayment(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: financeKeys.payments() });
      queryClient.invalidateQueries({ queryKey: financeKeys.invoices() });
      toast.success(t('finance.message.payment_registered_success'));
    },
    onError: (error: unknown) => {
      toast.error(t('finance.message.payment_register_error'), { 
        description: (axios.isAxiosError(error) ? error.response?.data?.message || error.message : (error as Error)?.message) || t('finance.message.try_again_later')
      });
    },
  });
}

export function useUpdatePayment(id: number) {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: (data: Partial<Payment>) => financeApi.updatePayment(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: financeKeys.payments() });
      queryClient.invalidateQueries({ queryKey: financeKeys.invoices() });
      toast.success(t('finance.message.payment_updated_success'));
    },
    onError: (error: unknown) => {
      toast.error(t('finance.message.payment_update_error'), { 
        description: (axios.isAxiosError(error) ? error.response?.data?.message || error.message : (error as Error)?.message) || t('finance.message.try_again_later')
      });
    },
  });
}

export function useDeletePayment() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: (id: number) => financeApi.deletePayment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: financeKeys.payments() });
      queryClient.invalidateQueries({ queryKey: financeKeys.invoices() });
      toast.success(t('finance.message.payment_deleted_success'));
    },
    onError: (error: unknown) => {
      toast.error(t('finance.message.payment_delete_error'), { 
        description: (axios.isAxiosError(error) ? error.response?.data?.message || error.message : (error as Error)?.message) || t('finance.message.try_again_later')
      });
    },
  });
}

export function useCategories() {
  return useQuery({
    queryKey: ['expenseCategories'],
    queryFn: () => financeApi.getCategories(),
  });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: (data: Parameters<typeof financeApi.createCategory>[0]) => financeApi.createCategory(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenseCategories'] });
      toast.success(t('finance.message.dds_article_added'));
    },
    onError: (error: unknown) => {
      toast.error(t('finance.message.dds_article_add_error'), { 
        description: (axios.isAxiosError(error) ? error.response?.data?.message || error.message : (error as Error)?.message) || t('finance.message.try_again_later')
      });
    },
  });
}

export function useUpdateCategory() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: (params: { id: string; data: Partial<ExpenseCategory> }) => financeApi.updateCategory(params.id, params.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenseCategories'] });
      toast.success(t('finance.message.dds_article_updated'));
    },
    onError: (error: unknown) => {
      toast.error(t('finance.message.dds_article_update_error'), { 
        description: (axios.isAxiosError(error) ? error.response?.data?.message || error.message : (error as Error)?.message) || t('finance.message.try_again_later')
      });
    },
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: (id: string) => financeApi.deleteCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenseCategories'] });
      toast.success(t('finance.message.dds_article_deleted'));
    },
    onError: (error: unknown) => {
      toast.error(t('finance.message.dds_article_delete_error'), { 
        description: (axios.isAxiosError(error) ? error.response?.data?.message || error.message : (error as Error)?.message) || t('finance.message.try_again_later')
      });
    },
  });
}

export function useImportStatement() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: (data: Parameters<typeof financeApi.importStatement>[0]) => financeApi.importStatement(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: financeKeys.payments() });
      queryClient.invalidateQueries({ queryKey: ['bankStatements'] });
      toast.success(t('finance.message.statement_imported_success'));
    },
    onError: (error: unknown) => {
      toast.error(t('finance.message.statement_import_error'), { 
        description: (axios.isAxiosError(error) ? error.response?.data?.message || error.message : (error as Error)?.message) || t('finance.message.check_file_format')
      });
    },
  });
}

export function useBankStatements() {
  return useQuery({
    queryKey: ['bankStatements'],
    queryFn: () => financeApi.getStatements(),
  });
}

export function useStatementLines(statementId: string) {
  return useQuery({
    queryKey: ['statementLines', statementId],
    queryFn: () => financeApi.getStatementLines(statementId),
    enabled: !!statementId,
  });
}

export function useAssignStatementLine() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: (params: { lineId: string; data: any }) => financeApi.assignStatementLine(params.lineId, params.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['statementLines'] });
      queryClient.invalidateQueries({ queryKey: financeKeys.payments() });
      queryClient.invalidateQueries({ queryKey: financeKeys.invoices() });
      toast.success(t('finance.message.statement_assign_success'));
    },
    onError: (error: unknown) => {
      toast.error(t('finance.message.statement_assign_error'), { 
        description: (axios.isAxiosError(error) ? error.response?.data?.message || error.message : (error as Error)?.message) || t('finance.message.try_again_later')
      });
    },
  });
}

export function useReconcileStatement() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: (params: { id: string; account?: string }) => financeApi.reconcileStatement(params.id, params.account),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bankStatements'] });
      queryClient.invalidateQueries({ queryKey: ['statementLines'] });
      toast.success(t('finance.message.statement_reconcile_success'));
    },
  });
}

export function useDeleteStatement() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: (id: string) => financeApi.deleteStatement(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bankStatements'] });
      toast.success(t('finance.message.statement_deleted_success'));
    },
  });
}

export function useUpdateStatementLine() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: (params: { lineId: string; data: any }) => financeApi.updateStatementLine(params.lineId, params.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['statementLines'] });
      toast.success(t('finance.message.statement_line_updated_success'));
    },
  });
}

export function useUnlinkPaymentFromInvoice() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: (paymentId: number | string) => financeApi.unlinkPaymentFromInvoice(paymentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: financeKeys.payments() });
      queryClient.invalidateQueries({ queryKey: financeKeys.invoices() });
      toast.success(t('finance.message.payment_unlinked_success'));
    },
    onError: (error: unknown) => {
      toast.error(t('finance.message.payment_unlink_error'), { 
        description: (axios.isAxiosError(error) ? error.response?.data?.message || error.message : (error as Error)?.message) || t('finance.message.try_again_later')
      });
    },
  });
}

export function useDDSReport(filters?: any) {
  return useQuery({
    queryKey: ['reportDDS', filters],
    queryFn: () => financeApi.getDDSReport(filters),
  });
}

export function usePLReport(filters?: any) {
  return useQuery({
    queryKey: ['reportPL', filters],
    queryFn: () => financeApi.getPLReport(filters),
  });
}

export function useReceivablesReport(filters?: any) {
  return useQuery({
    queryKey: ['reportReceivables', filters],
    queryFn: () => financeApi.getReceivablesReport(filters),
  });
}

export function useProjectFinanceSummary(projectId: number) {
  return useQuery({
    queryKey: ['projectFinanceSummary', projectId],
    queryFn: () => financeApi.getProjectSummary(projectId),
    enabled: !!projectId,
  });
}

export function useCalendarPayments(period?: 'week' | 'month') {
  return useQuery({
    queryKey: ['calendarPayments', period],
    queryFn: () => financeApi.getCalendarPayments(period),
  });
}

export function usePaymentRegister(filters?: any) {
  return useQuery({
    queryKey: ['paymentRegister', filters],
    queryFn: () => financeApi.getPaymentRegister(filters),
  });
}

export function useReconciliationAct(
  contractorId: number | string | null, 
  filters?: Parameters<typeof financeApi.getReconciliationAct>[1]
) {
  return useQuery({
    queryKey: ['reconciliationAct', contractorId, filters],
    queryFn: () => financeApi.getReconciliationAct(contractorId!, filters),
    enabled: !!contractorId,
  });
}
