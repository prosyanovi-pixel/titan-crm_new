import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/lib/i18n';

interface Filters {
  search?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  minAmount?: string;
  maxAmount?: string;
  contractorId?: string;
  expiresWithinDays?: number;
}

interface Props {
  filters: Filters;
  onChange: (next: Filters) => void;
  onClear?: () => void;
}

export const ContractFilters: React.FC<Props> = ({ filters, onChange, onClear }) => {
  const { t } = useTranslation();
  return (
    <div className="p-3 bg-muted rounded-md flex gap-2 flex-wrap">
      <Input
        placeholder={t('contracts.filters.search')}
        value={filters.search || ''}
        onChange={(e) => onChange({ ...filters, search: e.target.value })}
        className="w-64"
      />

      <Input
        type="date"
        value={filters.dateFrom || ''}
        onChange={(e) => onChange({ ...filters, dateFrom: e.target.value })}
      />
      <Input
        type="date"
        value={filters.dateTo || ''}
        onChange={(e) => onChange({ ...filters, dateTo: e.target.value })}
      />

      <Input
        placeholder={t('contracts.filters.min_amount')}
        value={filters.minAmount || ''}
        onChange={(e) => onChange({ ...filters, minAmount: e.target.value })}
        className="w-32"
      />
      <Input
        placeholder={t('contracts.filters.max_amount')}
        value={filters.maxAmount || ''}
        onChange={(e) => onChange({ ...filters, maxAmount: e.target.value })}
        className="w-32"
      />

      <Input
        placeholder={t('contracts.filters.contractor_id')}
        value={filters.contractorId || ''}
        onChange={(e) => onChange({ ...filters, contractorId: e.target.value })}
        className="w-40"
      />

      <div className="flex items-center gap-2">
        <label className="text-xs font-medium">{t('contracts.filters.expires_soon')}</label>
        <select
          value={filters.expiresWithinDays || ''}
          onChange={(e) => onChange({ ...filters, expiresWithinDays: e.target.value ? parseInt(e.target.value, 10) : undefined })}
          className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          <option value="">{t('contracts.filters.expires_none')}</option>
          <option value="7">{t('contracts.filters.expires_7_days')}</option>
          <option value="30">{t('contracts.filters.expires_30_days')}</option>
          <option value="90">{t('contracts.filters.expires_90_days')}</option>
        </select>
      </div>

      <div className="ml-auto flex items-center gap-2">
        <Button variant="ghost" onClick={() => onChange({})}>{t('contracts.filters.apply')}</Button>
        <Button variant="outline" onClick={onClear}>{t('contracts.filters.reset')}</Button>
      </div>
    </div>
  );
};

export default ContractFilters;
