import { useState } from 'react';
import { MailFilterType, MailSortType } from '../../types';

interface UseMailSearchReturn {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  mailFilter: MailFilterType;
  setMailFilter: (filter: MailFilterType) => void;
  mailSort: MailSortType;
  setMailSort: (sort: MailSortType) => void;
}

/**
 * Хук для управления поиском, фильтрацией и сортировкой писем
 * ~80 строк
 */
export function useMailSearch(): UseMailSearchReturn {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [mailFilter, setMailFilter] = useState<MailFilterType>('all');
  const [mailSort, setMailSort] = useState<MailSortType>('date-desc');

  return {
    searchQuery,
    setSearchQuery,
    mailFilter,
    setMailFilter,
    mailSort,
    setMailSort,
  };
}
