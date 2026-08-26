import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ContractsPage from '../pages/ContractsPage';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router';

// Mocks
vi.mock('@/lib/i18n', () => ({
  useTranslation: () => ({ t: (k: string) => k }),
}));

const mockedTable = {
  searchQuery: '',
  setSearchQuery: vi.fn(),
  selectedIds: new Set(['1', '2', '3']),
  toggleSelection: vi.fn(),
  toggleAllSelection: vi.fn(),
  clearSelection: vi.fn(),
  visibleColumns: {},
  toggleColumnVisibility: vi.fn(),
  columnOrder: [],
  moveColumn: vi.fn(),
  columnWidths: {},
  setColumnWidth: vi.fn(),
  sortConfig: {},
  handleSort: vi.fn(),
  tabsConfig: [{ id: 'contracts', label: 'contracts.list.title', visible: true }],
  moveTab: vi.fn(),
  toggleTabVisibility: vi.fn(),
  rowsPerPage: 25,
  setRowsPerPage: vi.fn(),
  currentPage: 1,
  setCurrentPage: vi.fn(),
};

vi.mock('@/hooks/useDataTable', () => ({
  useDataTable: () => mockedTable,
}));

const bulkDeleteMutate = vi.fn();
const bulkUpdateMutate = vi.fn();
vi.mock('../hooks', () => ({
  useBulkDeleteContracts: () => ({ mutate: bulkDeleteMutate }),
  useBulkUpdateContractStatus: () => ({ mutate: bulkUpdateMutate }),
  useDeleteContract: () => ({ mutate: vi.fn() }),
  useContracts: () => ({ data: { contracts: [], total: 0 }, isLoading: false, error: null }),
}));

vi.mock('@/context/LayoutContext', () => ({
  usePageSettings: vi.fn(),
}));

// Prevent actual API calls in BulkEditDialog if opened
vi.mock('@/lib/api', () => ({ api: { get: vi.fn().mockResolvedValue({ fields: [] }), post: vi.fn().mockResolvedValue({}) } }));

const queryClient = new QueryClient();

describe('ContractsPage bulk actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls bulk delete when Delete button clicked in toolbar', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={["/"]}>
          <ContractsPage />
        </MemoryRouter>
      </QueryClientProvider>
    );

    // Delete button text comes from i18n -> 'common.delete'
    const deleteBtn = await screen.findByText('common.delete');
    fireEvent.click(deleteBtn);

    expect(bulkDeleteMutate).toHaveBeenCalledTimes(1);
    expect(bulkDeleteMutate).toHaveBeenCalledWith(['1', '2', '3'], expect.any(Object));
  });
});
