import React from 'react';
import { useTranslation } from '@/lib/i18n';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { GetContractResponse } from '../types/contract.types';
import { formatDate } from '@/lib/formatters';
import { Link } from 'react-router-dom';

interface ContractFinanceProps {
  contract: GetContractResponse;
}

const formatCurrency = (amount: number | null | undefined, currency: string = 'RUB') => {
  if (amount == null) return '—';
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

export function ContractFinance({ contract }: ContractFinanceProps) {
  const { t } = useTranslation();
  const { financeSummary, invoices, payments, currency } = contract;

  const totalDue = (financeSummary?.totalInvoiced || 0) - (financeSummary?.totalPaid || 0);

  return (
    <div className="space-y-6">
      {/* Finance Summary */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('contracts.finance.total_invoiced')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(financeSummary?.totalInvoiced, currency)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('contracts.finance.total_paid')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(financeSummary?.totalPaid, currency)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('contracts.finance.total_due')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${totalDue > 0 ? 'text-red-600' : ''}`}>{formatCurrency(totalDue, currency)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Invoices Table */}
      <div>
        <h3 className="text-lg font-semibold mb-4">{t('contracts.finance.invoices')}</h3>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('finance.invoice.table.identifier')}</TableHead>
                <TableHead>{t('finance.invoice.table.issue_date')}</TableHead>
                <TableHead>{t('finance.invoice.table.due_date')}</TableHead>
                <TableHead className="text-right">{t('finance.invoice.table.amount')}</TableHead>
                <TableHead>{t('finance.invoice.table.status')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices && invoices.length > 0 ? (
                invoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell>
                      <Link to={`/finance/invoices/${invoice.id}`} className="font-medium text-primary hover:underline">
                        {invoice.identifier}
                      </Link>
                    </TableCell>
                    <TableCell>{formatDate(invoice.issueDate)}</TableCell>
                    <TableCell>{formatDate(invoice.dueDate)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(invoice.amountTotal, invoice.currency)}</TableCell>
                    <TableCell>{t(`finance.invoice.status.${invoice.status}`)}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    {t('general.no_data')}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Payments Table */}
      <div>
        <h3 className="text-lg font-semibold mb-4">{t('contracts.finance.payments')}</h3>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('finance.payment.table.date')}</TableHead>
                <TableHead>{t('finance.payment.table.description')}</TableHead>
                <TableHead className="text-right">{t('finance.payment.table.amount')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments && payments.length > 0 ? (
                payments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell>{formatDate(payment.paymentDate)}</TableCell>
                    <TableCell>{payment.description || t('common.no_data')}</TableCell>
                    <TableCell className="text-right">{formatCurrency(payment.amount, payment.currency)}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={3} className="h-24 text-center">
                    {t('general.no_data')}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}