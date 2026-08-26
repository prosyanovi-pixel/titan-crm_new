import { useQuery } from '@tanstack/react-query';
import { contractService } from '../api';

export function useContractMetrics() {
  return useQuery({
    queryKey: ['contracts-metrics'],
    queryFn: () => contractService.getMetrics(),
    staleTime: 5 * 60 * 1000,
  });
}
