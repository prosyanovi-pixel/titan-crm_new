/**
 * Contract Create Page
 * Form page for creating new contracts
 */

import React from 'react';
import { useTranslation } from '@/lib/i18n';
import { useNavigate } from 'react-router-dom';
import { ContractForm } from '../components';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function ContractCreatePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/contracts')}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="mt-4 text-3xl font-bold">{t('contracts.actions.create')}</h1>
      </div>

      <div className="rounded-lg border p-6">
        <ContractForm onSuccess={() => navigate('/contracts')} />
      </div>
    </div>
  );
}
