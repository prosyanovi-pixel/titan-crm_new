import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('@/lib/api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  }
}));

// Mock i18n to avoid needing I18nProvider in unit tests
vi.mock('@/lib/i18n', () => ({
  useTranslation: () => ({ t: (k: string) => k })
}));

// Mock the status-system Badge to avoid useStatuses -> useQuery dependency
vi.mock('@/components/ui/status-system', () => ({
  Badge: ({ name, id }: { name?: string; id: string }) =>
    React.createElement('span', { 'data-testid': `badge-${id}` }, name || id),
}));

import { api } from '@/lib/api';
import { ProjectStageEditor } from '../ProjectStageEditor';

/** Helper: wrap component in a fresh QueryClientProvider for isolation */
function renderWithClient(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
  );
}

describe('ProjectStageEditor', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('renders list from API', async () => {
    vi.mocked(api.get).mockResolvedValueOnce({ items: [{ id: 'todo', name: 'Todo', color: '#aaa' }] });
    renderWithClient(<ProjectStageEditor />);
    expect(screen.getByText(/loading/i)).toBeTruthy();
    // Both the Badge mock and font-medium div render the name, use getAllByText
    await waitFor(() => expect(screen.getAllByText('Todo').length).toBeGreaterThan(0));
  });

  it('adds new stage', async () => {
    vi.mocked(api.get).mockResolvedValueOnce({ items: [] });
    vi.mocked(api.post).mockResolvedValueOnce({ id: 'new', name: 'New stage', color: '#123456', variant: 'solid' });

    renderWithClient(<ProjectStageEditor />);
    await waitFor(() => expect(screen.queryByText(/loading/i)).toBeNull());

    const input = screen.getByPlaceholderText(/new_placeholder|Новая стадия|new stage/i);
    fireEvent.change(input, { target: { value: 'New stage' } });
    const addButton = screen.getByRole('button', { name: /add|добавить/i });
    fireEvent.click(addButton);

    await waitFor(() => expect(api.post).toHaveBeenCalled());
    // Both badge mock and font-medium div render "New stage" after state update
    await waitFor(() => expect(screen.getAllByText('New stage').length).toBeGreaterThan(0));
  });

  it('saves reorder', async () => {
    vi.mocked(api.get).mockResolvedValueOnce({ items: [{ id: 'a', name: 'A' }, { id: 'b', name: 'B' }] });
    vi.mocked(api.put).mockResolvedValue({ success: true });

    renderWithClient(<ProjectStageEditor />);
    await waitFor(() => expect(screen.getAllByText('A').length).toBeGreaterThan(0));

    // The Move button is the last button in each card row.
    // getAllByRole('button') returns all buttons in document order.
    // Cards have 3 icon buttons: Edit, Delete, Move (in that order).
    // For 2 cards the order is: [Edit_a, Delete_a, Move_a, Edit_b, Delete_b, Move_b]
    // Plus top-row buttons: colorpicker, select, Add. Move_a is index 5 (0-based).
    const allButtons = screen.getAllByRole('button');
    // Find the first Move button (last button within the first card = index 5 after header buttons)
    // Robust: click any button that triggers persistOrder — the last non-Add/non-select button
    const moveBtn = allButtons[allButtons.length - 1]; // last button = Move of last card
    fireEvent.click(moveBtn);

    await waitFor(() =>
      expect(api.put).toHaveBeenCalledWith('/settings/project-stages/reorder', { ids: ['a', 'b'] })
    );
  });
});


