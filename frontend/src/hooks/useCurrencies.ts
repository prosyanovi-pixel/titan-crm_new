import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface Currency {
  id: string;
  name: string;
  symbol?: string;
}

/**
 * Список валют из таблицы `currency` в БД.
 * Данные кэшируются навсегда (staleTime: Infinity) — изменения редки.
 * Для инвалидации кэша после добавления валюты используйте:
 *   queryClient.invalidateQueries({ queryKey: ['currencies'] })
 */
export function useCurrencies() {
  return useQuery<Currency[]>({
    queryKey: ['currencies'],
    queryFn: () => api.get('/references/currencies') as Promise<Currency[]>,
    staleTime: Infinity,
  });
}
