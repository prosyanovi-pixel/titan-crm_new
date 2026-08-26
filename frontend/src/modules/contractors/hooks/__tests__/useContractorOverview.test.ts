import { renderHook, act } from '@testing-library/react';
import { vi } from 'vitest';
import { useContractorOverview } from '../useContractorOverview';
import { api } from '@/lib/api';
import { toast } from 'sonner';

vi.mock('@/lib/api', () => ({
  api: {
    get: vi.fn(),
  },
}));

vi.mock('sonner', () => ({
  toast: {
    info: vi.fn(),
    error: vi.fn(),
    success: vi.fn(),
  },
}));

vi.mock('@/lib/i18n', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

describe('useContractorOverview', () => {
  const mockFormData = {
    id: 47,
    inn: '7826156685',
    legalForm: 'nano',
    name: 'ООО "ДЕЛОВЫЕ ЛИНИИ"',
  };

  const mockLegalFormsList = [
    { id: 'nano', name: 'НАО', groupId: 'legal', code: 'nano' },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should not update tax regime if external data does not provide tax system', async () => {
    // Mock API response for tax regimes
    vi.mocked(api.get).mockImplementation((url) => {
      if (url === '/finance/settings/tax-regimes') {
        return Promise.resolve([
          { id: 1, code: 'OSN', name: 'ОСН', appliesToLegalForms: ['ooo', 'ao'] },
          { id: 2, code: 'USN', name: 'УСН', appliesToLegalForms: ['ooo', 'ao'] },
        ]);
      }
      if (url.includes('/enrichment/lookup/')) {
        return Promise.resolve({
          raw: {
            inn: '7826156685',
            name: 'ООО "ДЕЛОВЫЕ ЛИНИИ"',
            legalForm: 'nano',
            // taxSystem is missing, simulating DaData response
          }
        });
      }
      return Promise.resolve({});
    });

    const handleChange = vi.fn();

    const { result } = renderHook(() =>
      useContractorOverview({
        formData: mockFormData as any,
        handleChange,
        isSheetOpen: true,
        legalFormsList: mockLegalFormsList as any,
      })
    );

    // Wait for useEffect to load tax regimes
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    // Trigger lookup
    await act(async () => {
      await result.current.handleLookupCurrentContractor();
    });

    // Should open comparison dialog but without taxRegimeId changes
    expect(result.current.comparisonData).toEqual(
      expect.not.objectContaining({ taxRegimeId: expect.anything() })
    );

    // Since the external data matches our mockFormData, there are no changes
    // So it should call toast.info with "generated.vse_dannye_aktual_ny"
    expect(toast.info).toHaveBeenCalledWith('generated.vse_dannye_aktual_ny');
  });

  it('should resolve tax regime correctly if external data provides tax system', async () => {
    // Mock API response
    vi.mocked(api.get).mockImplementation((url) => {
      if (url === '/finance/settings/tax-regimes') {
        return Promise.resolve([
          { id: 1, code: 'OSN', name: 'ОСН', appliesToLegalForms: ['ooo', 'ao'] },
        ]);
      }
      if (url.includes('/enrichment/lookup/')) {
        return Promise.resolve({
          raw: {
            inn: '7826156685',
            name: 'ООО "НОВЫЕ ЛИНИИ"', // Changed to trigger comparison
            legalForm: 'nano',
            taxSystem: 'osn', // tax system is provided!
          }
        });
      }
      return Promise.resolve({});
    });

    const handleChange = vi.fn();

    const { result } = renderHook(() =>
      useContractorOverview({
        formData: mockFormData as any,
        handleChange,
        isSheetOpen: true,
        legalFormsList: mockLegalFormsList as any,
      })
    );

    // Wait for useEffect to load tax regimes
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    // Trigger lookup
    await act(async () => {
      await result.current.handleLookupCurrentContractor();
    });

    // Should open comparison dialog WITH taxRegimeId = 1
    expect(result.current.isComparisonOpen).toBe(true);
    expect(result.current.comparisonData).toMatchObject({
      name: 'ООО "НОВЫЕ ЛИНИИ"',
      taxRegimeId: 1,
    });
  });
});
