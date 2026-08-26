import { render, screen, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { InvoiceFormContent } from '../InvoiceFormContent';
import { api } from '@/lib/api';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import React from 'react';

// Mock dependencies
vi.mock('@/lib/api', () => ({
  api: {
    get: vi.fn(() => Promise.resolve([])),
  },
}));

vi.mock('@/lib/i18n', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock('@/modules/lawyers', () => ({
  useLawyers: () => ({ lawyers: [] }),
}));

vi.mock('@/modules/tasks', () => ({
  useTasks: () => ({ tasks: [] }),
}));

// Mock Shadcn UI components that might cause issues in JSOM
vi.mock('@/components/shared/EntityCombobox', () => ({
    EntityCombobox: ({ value, onChange, options, placeholder }: any) => (
        <select 
            data-testid="contractor-select" 
            value={value} 
            onChange={(e) => onChange(e.target.value)}
        >
            <option value="">{placeholder}</option>
            {options.map((o: any) => <option key={o.id} value={o.id}>{o.label}</option>)}
        </select>
    )
}));

// Simple mock for CurrencyInput
vi.mock('@/components/ui/CurrencyInput', () => ({
    CurrencyInput: ({ value, onValueChange }: any) => (
        <input 
            data-testid="amount-input" 
            type="number" 
            value={value} 
            onChange={(e) => onValueChange(Number(e.target.value))} 
        />
    )
}));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

const FormWrapper = ({ children }: { children: any }) => {
    const form = useForm({
        defaultValues: {
            identifier: '',
            contractorId: 0,
            amount: 0,
            currency: 'RUB',
            issueDate: '2026-01-01',
            dueDate: '2026-01-01',
            isTaxable: false,
            vatRate: 0,
            vatAmount: 0
        }
    });
    return children(form);
};

describe('InvoiceFormContent VAT logic', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should calculate VAT amount automatically when amount and rate changes', async () => {
    let formRef: any;
    render(
        <QueryClientProvider client={queryClient}>
            <FormWrapper>
                {(form: any) => {
                    formRef = form;
                    return (
                        <InvoiceFormContent 
                            form={form} 
                            watchedCurrency="RUB" 
                            contractors={[]} 
                            projects={[]} 
                            currencies={[{id: 'RUB'}]} 
                            onContractorCreate={async () => 0}
                        />
                    );
                }}
            </FormWrapper>
        </QueryClientProvider>
    );

    // Set taxable and rate
    await act(async () => {
        formRef.setValue('isTaxable', true);
        formRef.setValue('vatRate', 22);
        formRef.setValue('amount', 1000);
    });

    // VAT should be 220 (1000 * 0.22)
    expect(formRef.getValues('vatAmount')).toBe(220);

    // Change amount
    await act(async () => {
        formRef.setValue('amount', 2000);
    });
    expect(formRef.getValues('vatAmount')).toBe(440);
  });

  it('should auto-fill VAT rate when contractor is selected', async () => {
    const mockContractors = [
        { id: 1, name: 'OSN Company', legalForm: 'OOO' }
    ];

    (api.get as any).mockResolvedValue({
        taxRegime: { requiresNds: true },
        activeTaxes: [{ type: 'НДС', rate: 22 }]
    });

    let formRef: any;
    render(
        <QueryClientProvider client={queryClient}>
            <FormWrapper>
                {(form: any) => {
                    formRef = form;
                    return (
                        <InvoiceFormContent 
                            form={form} 
                            watchedCurrency="RUB" 
                            contractors={mockContractors} 
                            projects={[]} 
                            currencies={[{id: 'RUB'}]} 
                            onContractorCreate={async () => 0}
                        />
                    );
                }}
            </FormWrapper>
        </QueryClientProvider>
    );

    // Select contractor
    await act(async () => {
        formRef.setValue('contractorId', 1);
    });

    // Check if API was called
    expect(api.get).toHaveBeenCalledWith('/contractors/1/taxes');

    // Check if VAT was set
    await waitFor(() => {
        expect(formRef.getValues('isTaxable')).toBe(true);
        expect(formRef.getValues('vatRate')).toBe(22);
    });
  });
});
