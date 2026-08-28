import { useQuery } from '@tanstack/react-query';
import { salesApi } from '../api';
import { SalesDeal } from '../types';

export function useSalesPipeline() {
  const query = useQuery({
    queryKey: ['sales', 'pipeline'],
    queryFn: () => salesApi.getPipeline(),
  });

  return query;
}
