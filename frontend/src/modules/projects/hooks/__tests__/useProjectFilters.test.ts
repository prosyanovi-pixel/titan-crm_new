/**
 * Тесты для хука useProjectFilters
 */

import { renderHook, act } from '@testing-library/react';
import { useProjectFilters } from '../useProjectFilters';
import { Project } from '../../types';

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
  {
    id: 2,
    name: 'Project 2',
    client: 'Client B',
    manager: 'Manager Y',
    status: 'pending',
    priority: 'Medium',
    stage: 'todo',
    budget: 200000,
    budgetUsed: 0,
    budgetUsedPercent: 0,
    deadline: '2025-01-31',
    tasksCount: 5,
    completedTasks: 0,
    parentId: null,
    subProjects: [],
  },
  {
    id: 3,
    name: 'Project 3',
    client: 'Client A',
    manager: 'Manager X',
    status: 'active',
    priority: 'Low',
    stage: 'done',
    budget: 150000,
    budgetUsed: 100,
    budgetUsedPercent: 100,
    deadline: '2024-11-30',
    tasksCount: 8,
    completedTasks: 8,
    parentId: null,
    subProjects: [],
  },
];

describe('useProjectFilters', () => {
  it('should return all projects when no filters applied', () => {
    const { result } = renderHook(() =>
      useProjectFilters({ projects: mockProjects, searchQuery: '' })
    );

    expect(result.current.filteredProjects).toHaveLength(3);
  });

  it('should filter by status', () => {
    const { result } = renderHook(() =>
      useProjectFilters({ projects: mockProjects, searchQuery: '' })
    );

    act(() => {
      result.current.setStatusFilter('active');
    });

    expect(result.current.filteredProjects).toHaveLength(2);
    expect(result.current.filteredProjects.every(p => p.status === 'active')).toBe(true);
  });

  it('should filter by priority', () => {
    const { result } = renderHook(() =>
      useProjectFilters({ projects: mockProjects, searchQuery: '' })
    );

    act(() => {
      result.current.setPriorityFilter('High');
    });

    expect(result.current.filteredProjects).toHaveLength(1);
    expect(result.current.filteredProjects[0].priority).toBe('High');
  });

  it('should filter by manager', () => {
    const { result } = renderHook(() =>
      useProjectFilters({ projects: mockProjects, searchQuery: '' })
    );

    act(() => {
      result.current.setManagerFilter('Manager X');
    });

    expect(result.current.filteredProjects).toHaveLength(2);
    expect(result.current.filteredProjects.every(p => p.manager === 'Manager X')).toBe(true);
  });

  it('should filter by search query', () => {
    const { result } = renderHook(() =>
      useProjectFilters({ projects: mockProjects, searchQuery: 'Project 1' })
    );

    expect(result.current.filteredProjects).toHaveLength(1);
    expect(result.current.filteredProjects[0].name).toBe('Project 1');
  });

  it('should apply multiple filters', () => {
    const { result } = renderHook(() =>
      useProjectFilters({ projects: mockProjects, searchQuery: '' })
    );

    act(() => {
      result.current.setStatusFilter('active');
      result.current.setManagerFilter('Manager X');
    });

    expect(result.current.filteredProjects).toHaveLength(2);
  });

  it('should reset filters', () => {
    const { result } = renderHook(() =>
      useProjectFilters({ projects: mockProjects, searchQuery: '' })
    );

    act(() => {
      result.current.setStatusFilter('active');
      result.current.setPriorityFilter('High');
      result.current.setManagerFilter('Manager X');
    });

    expect(result.current.statusFilter).toBe('active');
    expect(result.current.priorityFilter).toBe('High');
    expect(result.current.managerFilter).toBe('Manager X');

    act(() => {
      result.current.resetFilters();
    });

    expect(result.current.statusFilter).toBe('all');
    expect(result.current.priorityFilter).toBe('all');
    expect(result.current.managerFilter).toBe('all');
  });

  it('should build project tree when no filters', () => {
    const projectsWithChildren: Project[] = [
      {
        id: 1,
        name: 'Parent Project',
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
      {
        id: 2,
        name: 'Child Project',
        client: 'Client A',
        manager: 'Manager X',
        status: 'active',
        priority: 'High',
        stage: 'in_progress',
        budget: 50000,
        budgetUsed: 10,
        budgetUsedPercent: 20,
        deadline: '2024-12-31',
        tasksCount: 5,
        completedTasks: 2,
        parentId: 1,
        subProjects: [],
      },
    ];

    const { result } = renderHook(() =>
      useProjectFilters({ projects: projectsWithChildren, searchQuery: '' })
    );

    // When no filters, should build tree structure
    expect(result.current.filteredProjects).toHaveLength(1);
    expect(result.current.filteredProjects[0].subProjects).toHaveLength(1);
  });
});
