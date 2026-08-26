import { renderHook, act } from '@testing-library/react';
import { vi } from 'vitest';
import { useContractorActions } from '../useContractorActions';
import type { Contractor } from '../../types/contractor.types';

const mocks = vi.hoisted(() => ({
  navigate: vi.fn(),
  toastInfo: vi.fn(),
  toastSuccess: vi.fn(),
  toastError: vi.fn(),
  confirm: vi.fn(),
}));

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return {
    ...actual,
    useNavigate: () => mocks.navigate,
  };
});

vi.mock('@/lib/i18n', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock('sonner', () => ({
  toast: {
    info: mocks.toastInfo,
    success: mocks.toastSuccess,
    error: mocks.toastError,
  },
}));

describe('useContractorActions', () => {
  const contractors: Contractor[] = [
    {
      id: 1,
      name: 'ACME',
      tags: [],
      status: 'active',
      phone: '+79990000000',
      manager: 'Manager',
      legalAddress: 'Moscow',
    },
  ];

  beforeEach(() => {
    mocks.navigate.mockClear();
    mocks.toastInfo.mockClear();
    mocks.toastSuccess.mockClear();
    mocks.toastError.mockClear();
    mocks.confirm.mockClear();
    mocks.confirm.mockResolvedValue(true);
    localStorage.clear();
  });

  it('normalizes contractor id for create_task actions', async () => {
    const onCreateTask = vi.fn();
    const { result } = renderHook(() => useContractorActions({ contractors, onCreateTask }));

    await act(async () => {
      await result.current.handleQuickAction('create_task', '1');
    });

    expect(onCreateTask).toHaveBeenCalledWith('ACME', 1);
  });

  it('falls back to calendar navigation for create_event actions', async () => {
    localStorage.setItem('titan_user_id', '42');
    const { result } = renderHook(() => useContractorActions({ contractors }));

    await act(async () => {
      await result.current.handleQuickAction('create_event', 1);
    });

    expect(mocks.navigate).toHaveBeenCalledWith(expect.stringContaining('/calendar?'));
    expect(mocks.navigate.mock.calls[0][0]).toContain('assignee=42');
    expect(mocks.navigate.mock.calls[0][0]).toContain('contractorId=1');
  });

  it('confirms before deleting a contractor', async () => {
    const onDeleteContractor = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() => useContractorActions({ contractors, onDeleteContractor, confirm: mocks.confirm }));

    await act(async () => {
      await result.current.handleQuickAction('delete', '1');
    });

    expect(mocks.confirm).toHaveBeenCalledWith('common.confirm_deletion_text');
    expect(onDeleteContractor).toHaveBeenCalledWith(1);
  });

  it('delegates add_note to the provided callback', async () => {
    const onAddNote = vi.fn();
    const { result } = renderHook(() => useContractorActions({ contractors, onAddNote }));

    await act(async () => {
      await result.current.handleQuickAction('add_note', 1);
    });

    expect(onAddNote).toHaveBeenCalledWith('ACME', 1);
    expect(mocks.toastInfo).not.toHaveBeenCalled();
  });
});
