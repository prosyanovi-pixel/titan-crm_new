import { renderHook, act } from '@testing-library/react';
import { useDocumentsPage } from '../useDocumentsPage';
import { api } from '@/lib/api';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock dependencies
vi.mock('@/lib/api', () => ({
  api: {
    get: vi.fn().mockResolvedValue([]),
    post: vi.fn().mockResolvedValue({}),
    patch: vi.fn().mockResolvedValue({}),
  },
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

import { I18nProvider } from '@/lib/i18n';

vi.mock('@/context/LayoutContext', () => ({
  usePageSettings: vi.fn(),
}));

vi.mock('@/hooks/useDataTable', () => ({
  useDataTable: () => ({
    selectedIds: new Set(),
    sortConfig: null,
    searchQuery: '',
    currentPage: 1,
    rowsPerPage: '25',
    setCurrentPage: vi.fn(),
    setSearchQuery: vi.fn(),
    handleSort: vi.fn(),
    getSortDirection: vi.fn(),
    clearSelection: vi.fn(),
  }),
}));

vi.mock('@/components/ui/confirm-dialog', () => ({
  useConfirm: () => ({
    confirm: vi.fn().mockResolvedValue(true),
  }),
}));

vi.mock('@/modules/settings/hooks/useModuleSettings', () => ({
  useModuleSettings: () => ({
    settings: {
      display: { itemsPerPage: '25' },
      features: { enableStatistics: true, enableFolders: true, enableStarred: true },
    },
    isLoading: false,
  }),
}));

const mockStats: any = {
  used: 1024,
  total: 50 * 1024 * 1024 * 1024,
  percentage: 1,
  filesCount: 5,
  categories: {
    documents: 512,
    images: 512,
    others: 0
  }
};

describe('useDocumentsPage Breadcrumbs & Preview', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(api.get).mockImplementation((url: string) => {
      if (url.includes('/documents/stats')) return Promise.resolve(mockStats);
      return Promise.resolve([]);
    });
  });

  it('should initialize correctly', async () => {
    await act(async () => {
      renderHook(() => useDocumentsPage(), { wrapper: I18nProvider });
    });
  });

  it('should navigate to a folder and fetch its path', async () => {
    const mockPath = [
      { id: 'f1', name: 'Folder 1' },
      { id: 'f2', name: 'Folder 2' }
    ];
    
    vi.mocked(api.get).mockImplementation((url: string) => {
      if (url.includes('/documents/path/f2')) return Promise.resolve(mockPath);
      return Promise.resolve([]);
    });

    const { result } = renderHook(() => useDocumentsPage(), { wrapper: I18nProvider });

    // Wait for initial load
    await act(async () => {
      await Promise.resolve();
    });

    await act(async () => {
      result.current.handleFileClick({ id: 'f2', name: 'Folder 2', type: 'folder', date: '2026-01-01' });
    });

    expect(result.current.currentFolderId).toBe('f2');
    
    // Wait for the path effect and files refresh to run
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(api.get).toHaveBeenCalledWith(expect.stringContaining('/documents/path/f2'));
    expect(result.current.breadcrumbs).toEqual(mockPath);
  });

  it('should switch filters', async () => {
    const { result } = renderHook(() => useDocumentsPage(), { wrapper: I18nProvider });
    await act(async () => { await Promise.resolve(); });

    await act(async () => {
      result.current.setFilter('recent');
    });

    expect(result.current.filter).toBe('recent');
  });

  it('should open preview when a file is clicked', async () => {
    const { result } = renderHook(() => useDocumentsPage(), { wrapper: I18nProvider });
    await act(async () => { await Promise.resolve(); });

    const mockFile = { id: 'd1', name: 'Doc.pdf', type: 'pdf' as any, date: '2026-01-01' };

    await act(async () => {
      result.current.handleFileClick(mockFile);
    });

    expect(result.current.previewFile).toEqual(mockFile);
  });

  it('should persist viewMode in localStorage', async () => {
    const { result } = renderHook(() => useDocumentsPage(), { wrapper: I18nProvider });
    
    act(() => {
      result.current.setViewMode('list');
    });

    expect(localStorage.getItem('documents-view-mode')).toBe('list');
  });
});
