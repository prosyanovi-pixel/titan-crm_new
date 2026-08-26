import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { MailAccount } from '../types';
import { useTranslation } from '@/lib/i18n';

interface UseMailAccountsReturn {
  accounts: MailAccount[];
  selectedAccountId: string;
  setSelectedAccountId: (id: string) => void;
  includeSubfolders: boolean;
  setIncludeSubfolders: (value: boolean) => void;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

/**
 * Хук для управления почтовыми аккаунтами
 */
export const useMailAccounts = (): UseMailAccountsReturn => {
  const { t } = useTranslation();
  const [accounts, setAccounts] = useState<MailAccount[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  const [includeSubfolders, setIncludeSubfolders] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchAccounts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.get('/mail/accounts');
      setAccounts(response);
      
      if (response.length > 0) {
        const defaultAccount = response.find((a: MailAccount) => a.isDefault) || response[0];
        setSelectedAccountId(defaultAccount.id);
        setIncludeSubfolders(Boolean(defaultAccount.includeSubfolders));
      }
    } catch (err) {
      console.error('Error fetching accounts:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch accounts'));
      toast.error(t('mail.errors.load_accounts_failed'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  // Загрузка аккаунтов при монтировании
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchAccounts();
  }, [fetchAccounts]);

  // Обновление includeSubfolders при смене аккаунта
  useEffect(() => {
    if (selectedAccountId) {
      const account = accounts.find((a) => a.id === selectedAccountId);
      if (account) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setIncludeSubfolders(Boolean(account.includeSubfolders));
      }
    }
  }, [selectedAccountId, accounts]);

  const handleSetSelectedAccountId = useCallback((id: string) => {
    setSelectedAccountId(id);
  }, []);

  const handleSetIncludeSubfolders = useCallback((value: boolean) => {
    setIncludeSubfolders(value);
  }, []);

  return {
    accounts,
    selectedAccountId,
    setSelectedAccountId: handleSetSelectedAccountId,
    includeSubfolders,
    setIncludeSubfolders: handleSetIncludeSubfolders,
    loading,
    error,
    refetch: fetchAccounts,
  };
};