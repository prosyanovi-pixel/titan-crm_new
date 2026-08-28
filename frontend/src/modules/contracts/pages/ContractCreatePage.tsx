/**
 * Contract Create Page
 * Form page for creating new contracts
 */

import React from 'react';
import { useTranslation } from '@/lib/i18n';
import { useNavigate, useLocation } from 'react-router-dom';
import { ContractForm } from '../components';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { Contract } from '../types/contract.types';

export default function ContractCreatePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as { quote?: any } | null;
  const sourceQuote = state?.quote;

  // Если мы конвертируем КП в Договор, подготовим начальные данные
  const initialContract: Partial<Contract> | undefined = sourceQuote ? {
    name: sourceQuote.number ? `Договор на базе ${sourceQuote.number}` : '',
    contractorId: sourceQuote.contractorId,
    amount: sourceQuote.totalAmount,
    currency: 'RUB',
    status: 'draft',
    type: 'service',
    description: sourceQuote.notes || ''
  } : undefined;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold tracking-tight">
          {sourceQuote ? t('contracts.actions.create_from_quote') : t('contracts.actions.create')}
        </h1>
      </div>

      <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6">
        <ContractForm 
          contract={initialContract as Contract} 
          onSuccess={() => navigate('/contracts')} 
        />
      </div>
    </div>
  );
}
