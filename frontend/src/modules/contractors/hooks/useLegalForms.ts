import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface LegalForm {
  code: string;
  name: string;
  description?: string;
  isActive: boolean;
}

/**
 * Хук для получения справочника юридических форм.
 */
export function useLegalForms(options: { activeOnly?: boolean } = { activeOnly: true }) {
  return useQuery({
    queryKey: ['legalForms', options],
    queryFn: async () => {
      const response = await api.get('/contractors/legal-forms', { 
        params: { activeOnly: options.activeOnly } 
      });
      return response as LegalForm[];
    },
    staleTime: 24 * 60 * 60 * 1000, // 24 часа (справочник меняется редко)
  });
}
