import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ContractorRequisitesTab } from '../ContractorRequisitesTab';
import { vi } from 'vitest';
import React from 'react';
import { I18nProvider } from '@/lib/i18n';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock the settings hook
vi.mock('@/hooks/use-settings', () => ({
  useSettings: () => ({
    getPositions: () => [
      { id: '1', name: 'Директор' },
      { id: '2', name: 'Бухгалтер' }
    ],
    getLegalFormsByModule: () => [
      { id: 'ooo', name: 'ООО', type: 'legal' },
      { id: 'ip', name: 'ИП', type: 'individual' }
    ]
  })
}));

// Mock useCurrencies
vi.mock('@/hooks/useCurrencies', () => ({
  useCurrencies: () => ({
    data: [
      { code: 'RUB', name: 'Российский рубль', symbol: '₽' },
      { code: 'USD', name: 'Доллар США', symbol: '$' }
    ]
  })
}));

// Mock the translation hook
vi.mock('@/lib/i18n', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/i18n')>();
  return {
    ...actual,
    useTranslation: () => ({
      t: (key: string) => key,
      language: 'ru',
      setLanguage: vi.fn(),
    })
  };
});

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <I18nProvider>
        {children}
      </I18nProvider>
    </QueryClientProvider>
  );
};

describe('ContractorRequisitesTab', () => {
  const mockHandleChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders basic requisites fields', () => {
    render(
      <ContractorRequisitesTab 
        formData={{ 
          legalEntityType: 'legal',
          inn: '1234567890',
          fullName: 'ООО Ромашка',
          legalAddress: 'г. Москва, ул. Пушкина, д. Колотушкина'
        }} 
        handleChange={mockHandleChange} 
      />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByDisplayValue('1234567890')).toBeInTheDocument();
    expect(screen.getByDisplayValue('ООО Ромашка')).toBeInTheDocument();
    expect(screen.getByDisplayValue('г. Москва, ул. Пушкина, д. Колотушкина')).toBeInTheDocument();
  });

  it('renders bank accounts', () => {
    const bankAccounts = [
      {
        id: '1',
        bankName: 'Сбербанк',
        bik: '044525225',
        accountNumber: '40702810123450000001',
        correspondentAccount: '30101810400000000225',
        currency: 'RUB',
        isPrimary: true
      }
    ];

    render(
      <ContractorRequisitesTab 
        formData={{ bankAccounts }} 
        handleChange={mockHandleChange} 
      />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByText('Сбербанк')).toBeInTheDocument();
    expect(screen.getByText('40702810123450000001')).toBeInTheDocument();
    expect(screen.getByText('generated.bik: 044525225')).toBeInTheDocument();
  });

  it('allows opening add bank account sheet', () => {
    render(
      <ContractorRequisitesTab 
        formData={{ bankAccounts: [] }} 
        handleChange={mockHandleChange} 
      />,
      { wrapper: createWrapper() }
    );

    // There might be multiple elements with this text (e.g. title and button)
    const addButtons = screen.getAllByText('contractor_sheet.action.add_bank');
    fireEvent.click(addButtons[0]);
    
    // Sheet should open
    expect(screen.getByText('contractor_sheet.field.bank_name')).toBeInTheDocument();
  });

  it('updates simple fields', () => {
    render(
      <ContractorRequisitesTab 
        formData={{ inn: '123' }} 
        handleChange={mockHandleChange} 
      />,
      { wrapper: createWrapper() }
    );

    const innInput = screen.getByDisplayValue('123');
    fireEvent.change(innInput, { target: { value: '1234567890' } });
    
    expect(mockHandleChange).toHaveBeenCalledWith('inn', '1234567890');
  });
});