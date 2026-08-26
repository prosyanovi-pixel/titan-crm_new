/**
 * Тесты для хука useProjectCRUD
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useProjectCRUD } from '../useProjectCRUD';
import type { Project } from '../../types';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { I18nProvider } from '@/lib/i18n';
import { SettingsProvider } from '@/context/SettingsContext';

// Mock API
vi.mock('@/lib/api', () => ({
  api: {
    get: vi.fn(() => Promise.resolve([])),
    post: vi.fn(() => Promise.resolve({})),
    put: vi.fn(() => Promise.resolve({})),
    delete: vi.fn(() => Promise.resolve({})),
  },
}));

// Mock translation
vi.mock('@/lib/i18n', async () => {
  const actual = await vi.importActual('@/lib/i18n');
  return {
    ...actual,
    useTranslation: () => ({ t: (key: string) => key }),
  };
});

vi.mock('@/components/ui/confirm-dialog', () => ({
  useConfirm: () => ({
    confirm: vi.fn(() => Promise.resolve(true)),
  }),
}));

const mockProjects: Project[] = [
  {
    id: 1,
    name: 'Project 1',
    client: 'Client A',
    manager: 'Manager X',
    status: 'active',
    priority: 'High',
    stage: 'in_progress',
    budget: 100000,
    budgetUsed: 30,
    budgetUsedPercent: 30,
    deadline: '2024-12-31',
    tasksCount: 10,
    completedTasks: 5,
    parentId: null,
    subProjects: [],
  },
];

// Create QueryClient once for all tests
const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
});

describe('useProjectCRUD', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    queryClient.clear();
  });

  const createWrapper = (initialProjects: Project[] = mockProjects) => {
    const wrapper = ({ children }: { children: React.ReactNode }) =>
      React.createElement(
        I18nProvider,
        { children },
        React.createElement(
          QueryClientProvider,
          { client: queryClient, children: React.createElement(SettingsProvider, { children }) }
        )
      );
    
    const setProjectsState = vi.fn();
    const selectedIds = new Set<number>();
    const clearSelection = vi.fn();
    
    const { result } = renderHook(() =>
      useProjectCRUD(initialProjects, setProjectsState, selectedIds, clearSelection),
      { wrapper }
    );
    
    return { result, setProjectsState, clearSelection };
  };

  it('should initialize with default values', () => {
    const { result } = createWrapper();

    expect(result.current.selectedProject).toBeNull();
    expect(result.current.sheetOpen).toBe(false);
    expect(result.current.bulkEditOpen).toBe(false);
  });

  it('should open sheet for new project', () => {
    const { result } = createWrapper();

    act(() => {
      result.current.handleAddProject();
    });

    expect(result.current.selectedProject).toBeNull();
    expect(result.current.sheetOpen).toBe(true);
  });

  it('should open sheet for editing project', () => {
    const { result } = createWrapper();

    act(() => {
      result.current.handleEditProject(mockProjects[0]);
    });

    expect(result.current.selectedProject).toEqual(mockProjects[0]);
    expect(result.current.sheetOpen).toBe(true);
  });

  it('should create new project', async () => {
    const newProject = {
      id: 0,
      name: 'New Project',
      client: 'New Client',
    } as Project;

    const { api } = await import('@/lib/api');
    vi.mocked(api.post).mockResolvedValueOnce({
      ...newProject,
      id: 2,
    });

    const { result, setProjectsState } = createWrapper();

    await act(async () => {
      await result.current.handleSaveProject(newProject);
    });

    expect(api.post).toHaveBeenCalledWith('/projects', newProject);
    expect(setProjectsState).toHaveBeenCalled();
  });

  it('should update existing project', async () => {
    const updatedProject = {
      ...mockProjects[0],
      name: 'Updated Project',
    };

    const { api } = await import('@/lib/api');
    vi.mocked(api.put).mockResolvedValueOnce(updatedProject);

    const { result, setProjectsState } = createWrapper();

    // First select the project
    act(() => {
      result.current.handleEditProject(mockProjects[0]);
    });

    await act(async () => {
      await result.current.handleSaveProject(updatedProject);
    });

    expect(api.put).toHaveBeenCalledWith(`/projects/${mockProjects[0].id}`, updatedProject);
    expect(setProjectsState).toHaveBeenCalled();
  });

  it('should delete project', async () => {
    const { api } = await import('@/lib/api');
    vi.mocked(api.delete).mockResolvedValueOnce({});

    const { result, setProjectsState } = createWrapper();

    await act(async () => {
      await result.current.handleDeleteProject(1);
    });

    expect(api.delete).toHaveBeenCalledWith('/projects/1');
    expect(setProjectsState).toHaveBeenCalled();
  });

  it('should handle bulk delete', async () => {
    const { api } = await import('@/lib/api');
    vi.mocked(api.delete).mockResolvedValue({});

    // Mock confirm to return true
    global.confirm = vi.fn(() => true);

    const selectedIds = new Set<number>([1, 2]);
    const clearSelection = vi.fn();
    const setProjectsState = vi.fn();

    const wrapper = ({ children }: { children: React.ReactNode }) =>
      React.createElement(
        I18nProvider,
        { children },
        React.createElement(
          QueryClientProvider,
          { client: queryClient, children: React.createElement(SettingsProvider, { children }) }
        )
      );

    const { result } = renderHook(() =>
      useProjectCRUD(mockProjects, setProjectsState, selectedIds, clearSelection),
      { wrapper }
    );

    await act(async () => {
      await result.current.handleBulkDelete();
    });

    expect(api.delete).toHaveBeenCalledTimes(2);
    expect(clearSelection).toHaveBeenCalled();
  });

  it('should handle bulk edit', async () => {
    const { api } = await import('@/lib/api');
    vi.mocked(api.post).mockResolvedValueOnce([
      { ...mockProjects[0], status: 'active' },
    ]);

    const selectedIds = new Set<number>([1, 2]);
    const clearSelection = vi.fn();
    const setProjectsState = vi.fn();

    const wrapper = ({ children }: { children: React.ReactNode }) =>
      React.createElement(
        I18nProvider,
        { children },
        React.createElement(
          QueryClientProvider,
          { client: queryClient, children: React.createElement(SettingsProvider, { children }) }
        )
      );

    const { result } = renderHook(() =>
      useProjectCRUD(mockProjects, setProjectsState, selectedIds, clearSelection),
      { wrapper }
    );

    await act(async () => {
      await result.current.handleBulkEdit('status', 'active');
    });

    expect(api.put).toHaveBeenCalledTimes(1);
    expect(api.put).toHaveBeenCalledWith('/projects/1', expect.objectContaining({
      status: 'active',
    }));
    expect(clearSelection).toHaveBeenCalled();
  });

  it('should handle API errors gracefully', async () => {
    const { api } = await import('@/lib/api');
    vi.mocked(api.post).mockRejectedValueOnce(new Error('API Error'));

    const { result, setProjectsState } = createWrapper();

    await act(async () => {
      await result.current.handleSaveProject(mockProjects[0]);
    });

    expect(setProjectsState).not.toHaveBeenCalled();
  });
});
