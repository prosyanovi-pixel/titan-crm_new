import { renderHook, waitFor } from '@testing-library/react';
import { useContracts } from '../useContracts';
import { contractService } from '../../api';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

// Mock the service
vi.mock('../../api', () => ({
  contractService: {
    getContracts: vi.fn(),
  },
}));

// Mock translations
vi.mock('@/lib/i18n', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

const mockToast = vi.fn();
// Mock toast
vi.mock('@/components/ui/use-toast', () => ({
  useToast: () => ({
    toast: mockToast,
  }),
}));

const createQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

const wrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = createQueryClient();
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
};

describe('useContracts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch contracts successfully', async () => {
    const mockData = {
      contracts: [{ id: '1', name: 'Contract 1' }],
      pagination: { total: 1, page: 1, limit: 20, pages: 1 },
    };
    (contractService.getContracts as any).mockResolvedValue(mockData);

    const { result } = renderHook(() => useContracts(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.contracts).toEqual(mockData.contracts);
    expect(contractService.getContracts).toHaveBeenCalled();
  });

  it('should show toast on 401 error', async () => {
    const error = { statusCode: 401, message: 'Unauthorized' };
    (contractService.getContracts as any).mockRejectedValue(error);

    renderHook(() => useContracts(), { wrapper });

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
        variant: 'destructive',
        title: 'general.error',
      }));
    });
  });
});
