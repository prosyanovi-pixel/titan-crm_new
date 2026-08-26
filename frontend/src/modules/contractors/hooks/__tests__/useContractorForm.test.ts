import { renderHook, act } from '@testing-library/react';
import { useContractorForm } from '../useContractorForm';
import { Contractor } from '../../types/contractor.types';
import { vi } from 'vitest';
import React from 'react';
import { I18nProvider } from '@/lib/i18n';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Create a wrapper component with both providers
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(
      QueryClientProvider,
      { client: queryClient },
      React.createElement(I18nProvider, { children }, children)
    );
};

describe('useContractorForm', () => {
  it('should initialize with default values for a new contractor', () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => useContractorForm({}), { wrapper });

    expect(result.current.formData.status).toBe('active');
    expect(result.current.formData.legalForm).toBe('ooo');
    expect(result.current.isValid).toBe(false);
  });

  it('should validate INN correctly', async () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => useContractorForm({}), { wrapper });

    await act(async () => {
      result.current.handleChange('name', 'Test');
      result.current.handleChange('inn', '123');
    });

    await act(async () => {
      try { result.current.handleSubmit(); } catch (e) {
        // Expected to fail validation
      }
    });

    expect(result.current.errors.inn).toBe('Неверный формат ИНН');
    expect(result.current.isValid).toBe(false);

    await act(async () => {
      result.current.handleChange('inn', '1234567890');
    });

    expect(result.current.errors.inn).toBeUndefined();
  });

  it('should update legalEntityType automatically when legalForm changes', async () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => useContractorForm({}), { wrapper });

    await act(async () => {
      result.current.handleChange('legalForm', 'ip');
    });
    expect(result.current.formData.legalEntityType).toBe('individual');

    await act(async () => {
      result.current.handleChange('legalForm', 'self');
    });
    expect(result.current.formData.legalEntityType).toBe('private');
  });

  it('should call onSave with full contractor data on submit', async () => {
    const wrapper = createWrapper();
    const onSave = vi.fn();
    const { result } = renderHook(() => useContractorForm({ onSave }), { wrapper });

    await act(async () => {
      result.current.handleChange('name', 'Test Corp');
    });

    await act(async () => {
      result.current.handleSubmit();
    });

    expect(onSave).toHaveBeenCalled();
    const savedData = onSave.mock.calls[0][0];
    expect(savedData.name).toBe('Test Corp');
    expect(savedData.id).toBeDefined();
  });
});
