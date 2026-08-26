import { render, screen, fireEvent, waitFor } from '@/test-utils';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ProjectRevenuesTab } from '../ProjectRevenuesTab';
import { ProjectExpensesTab } from '../ProjectExpensesTab';
import { ProjectStagesTab } from '../ProjectStagesTab';
import { useProjectRevenues } from '../../../hooks/useProjectRevenues';
import { useProjectExpenses } from '../../../hooks/useProjectExpenses';
import { useProjectStages } from '../../../hooks/useProjectStages';
import { useContractors } from '@/modules/contractors';
import { useProjectConfirmations } from '../../../hooks/useProjectConfirmations';

// Mock the hooks
vi.mock('../../../hooks/useProjectRevenues', () => ({
  useProjectRevenues: vi.fn(),
}));

vi.mock('../../../hooks/useProjectExpenses', () => ({
  useProjectExpenses: vi.fn(),
}));

vi.mock('../../../hooks/useProjectStages', () => ({
  useProjectStages: vi.fn(),
}));

vi.mock('@/modules/contractors', () => ({
  useContractors: vi.fn(() => ({ contractors: [] })),
  useContractorsList: vi.fn(() => ({ contractors: [] })),
}));

vi.mock('../../../hooks/useProjectConfirmations', () => ({
  useProjectConfirmations: vi.fn(() => ({
    confirmDeleteRevenue: vi.fn(),
    confirmDeleteExpense: vi.fn(),
    confirmDeleteStage: vi.fn(),
  })),
}));

// Mock api
vi.mock('@/lib/api', () => ({
  api: {
    get: vi.fn(() => Promise.resolve([])),
    post: vi.fn(() => Promise.resolve({})),
    put: vi.fn(() => Promise.resolve({})),
    delete: vi.fn(() => Promise.resolve({})),
  },
}));

vi.mock('@/lib/i18n', async (importOriginal) => {
  const actual = await importOriginal<any>();
  return {
    ...actual,
    useTranslation: vi.fn(() => ({
      t: (key: string) => key,
    })),
  };
});

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

describe('Project Tabs Reproduction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('ProjectRevenuesTab: should show the sheet when Add button is clicked even if empty', async () => {
    // Setup mock for empty revenues
    (useProjectRevenues as any).mockReturnValue({
      revenues: [],
      isLoading: false,
      createRevenue: vi.fn(),
      updateRevenue: vi.fn(),
      deleteRevenue: vi.fn(),
      markAsReceived: vi.fn(),
    });

    (useProjectStages as any).mockReturnValue({
      stages: [],
    });

    render(<ProjectRevenuesTab projectId={1} />);

    // Check if EmptyState is shown
    expect(screen.getByText('projects.revenues.empty')).toBeInTheDocument();

    // Click Add button
    const addButton = screen.getByText('projects.revenues.add');
    fireEvent.click(addButton);

    // Verify if ProjectRevenuesSheet title is in the document
    await waitFor(() => {
      expect(screen.getByText('projects.revenues.create_title')).toBeInTheDocument();
    });
  });

  it('ProjectExpensesTab: should show the sheet when Add button is clicked even if empty', async () => {
    // Setup mock for empty expenses
    (useProjectExpenses as any).mockReturnValue({
      expenses: [],
      categories: [],
      isLoading: false,
      createExpense: vi.fn(),
      updateExpense: vi.fn(),
      deleteExpense: vi.fn(),
      loadCategories: vi.fn(),
    });

    (useProjectStages as any).mockReturnValue({
      stages: [],
    });

    render(<ProjectExpensesTab projectId={1} />);

    // Check if EmptyState is shown
    expect(screen.getByText('projects.expenses.empty')).toBeInTheDocument();

    // Click Add button
    const addButton = screen.getByText('projects.expenses.add');
    fireEvent.click(addButton);

    // Verify if ProjectExpensesSheet title is in the document
    await waitFor(() => {
      expect(screen.getByText('projects.expenses.create_title')).toBeInTheDocument();
    });
  });

  it('ProjectStagesTab: should show the sheet when Add button is clicked even if empty', async () => {
    // Setup mock for empty stages
    (useProjectStages as any).mockReturnValue({
      stages: [],
      summary: {},
      isLoading: false,
      createStage: vi.fn(),
      loadStages: vi.fn(),
      loadSummary: vi.fn(),
    });

    render(<ProjectStagesTab projectId={1} />);

    // Check if EmptyState is shown
    expect(screen.getByText('projects.stages.empty')).toBeInTheDocument();

    // Click Add button
    const addButton = screen.getByText('projects.stages.add');
    fireEvent.click(addButton);

    // Verify if ProjectStagesSheet/view is open.
    await waitFor(() => {
      expect(screen.getByPlaceholderText('projects.stages.placeholder.name')).toBeInTheDocument();
    });
  });
});
