import { render, screen, fireEvent, waitFor } from '@/test-utils';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ProjectStagesTab } from '../ProjectStagesTab';
import { useProjectStages } from '../../../hooks/useProjectStages';
import { api } from '@/lib/api';

// Mock dependencies
vi.mock('../../../hooks/useProjectStages', () => ({
  useProjectStages: vi.fn(),
}));

vi.mock('@/lib/api', () => ({
  api: {
    get: vi.fn(() => Promise.resolve([])),
    post: vi.fn(() => Promise.resolve({ id: 'new-task-id' })),
    put: vi.fn(() => Promise.resolve({})),
    delete: vi.fn(() => Promise.resolve({})),
  },
}));

vi.mock('@/lib/i18n', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    useTranslation: vi.fn(() => ({
      t: (key: string) => key,
    })),
  };
});

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

describe('ProjectStagesTab', () => {
  const mockStages = [
    {
      id: 1,
      name: 'Stage 1',
      projectId: 100,
      tasks: [],
      startDate: '01.01.2023',
      endDate: '31.12.2023',
      isCompleted: false,
      progress: 0
    }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useProjectStages).mockReturnValue({
      stages: mockStages as any,
      summary: {
        totalStages: 1,
        completedStages: 0,
        pendingStages: 1,
        avgProgress: 0,
        totalTasks: 0,
        completedTasks: 0,
      },
      isLoading: false,
      loadStages: vi.fn(),
      loadSummary: vi.fn(),
    } as any);
  });

  it('should pass projectName to new tasks', async () => {
    render(<ProjectStagesTab projectId={100} projectName="Test Project" />);

    // Expand stage
    fireEvent.click(screen.getByText('Stage 1'));

    // Click add task (second element is the inline creator button, first is just empty state text)
    const addTaskButton = screen.getAllByText('projects.stages.tasks.add_first')[1];
    fireEvent.click(addTaskButton);

    // Fill task title
    const titleInput = screen.getByPlaceholderText('projects.stages.task_title_placeholder');
    fireEvent.change(titleInput, { target: { value: 'New Task' } });

    // Save task
    const saveButton = screen.getByText('common.save');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/tasks', expect.objectContaining({
        title: 'New Task',
        project: 'Test Project',
        projectId: 100,
        stageId: 1
      }));
    });
  });
});
