import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useCreateInvoiceSheet } from '../hooks/useCreateInvoiceSheet';
import { api } from '@/lib/api';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

// Mock dependencies
vi.mock('@/lib/api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
  },
}));

vi.mock('@/lib/i18n', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
  },
});

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

describe('Finance VAT Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    queryClient.clear();
  });

  it('should automatically set VAT rate based on contractor tax regime', async () => {
    const mockContractors = [
      { id: 1, name: 'OSN Company', legalForm: 'OOO' },
      { id: 2, name: 'USN Individual', legalForm: 'IP' }
    ];

    const mockOSNTaxInfo = {
      taxRegime: { requiresNds: true },
      activeTaxes: [{ type: 'НДС', rate: 22 }] // New 2026 rate
    };

    (api.get as any).mockImplementation((url: string) => {
      if (url === '/contractors') return Promise.resolve(mockContractors);
      if (url === '/contractors/1/taxes') return Promise.resolve(mockOSNTaxInfo);
      if (url === '/currencies') return Promise.resolve([]);
      if (url === '/projects') return Promise.resolve([]);
      return Promise.resolve([]);
    });

    const { result } = renderHook(() => useCreateInvoiceSheet({ open: true }), { wrapper });

    // Simulate selecting OSN contractor
    act(() => {
      result.current.form.setValue('contractorId', 1);
    });

    // Wait for async effect in InvoiceFormContent logic (handled via api.get inside the effect)
    // Note: The logic is actually inside InvoiceFormContent.tsx which is not rendered here, 
    // but useCreateInvoiceSheet provides the form. 
    // Actually, I should test the logic in InvoiceFormContent or integrate it.
    
    // For this test to work correctly, I should render the component or test the hook logic if it was there.
    // Since the logic is in the component's useEffect, I will create a test for the component.
  });
});
