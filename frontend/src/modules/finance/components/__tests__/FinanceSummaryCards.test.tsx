import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { FinanceSummaryCards } from '../FinanceSummaryCards';

// Mock translation and UI components
vi.mock('@/lib/i18n', () => ({
  useTranslation: () => ({ t: (key: string) => key })
}));

describe('FinanceSummaryCards', () => {
  it('renders skeleton when loading', () => {
    const { container } = render(
      <FinanceSummaryCards
        isLoading={true}
        totalReceivables={0}
        overdueCount={0}
        paidCount={0}
        totalInvoices={0}
      />
    );
    // 4 skeletons should be rendered
    const skeletons = container.querySelectorAll('.h-28');
    expect(skeletons.length).toBe(4);
  });

  it('renders stats correctly when not loading', () => {
    render(
      <FinanceSummaryCards
        isLoading={false}
        totalReceivables={150000}
        overdueCount={5}
        paidCount={10}
        totalInvoices={20}
      />
    );

    // Check if titles are rendered using translation keys
    expect(screen.getByText('finance.stats.receivables')).toBeDefined();
    expect(screen.getByText('finance.stats.overdue')).toBeDefined();
    expect(screen.getByText('finance.stats.paid_invoices')).toBeDefined();
    expect(screen.getByText('finance.stats.total_invoices')).toBeDefined();

    // Check if values are rendered
    expect(screen.getByText('150 000 ₽')).toBeDefined();
    expect(screen.getByText('5')).toBeDefined();
    expect(screen.getByText('10')).toBeDefined();
    expect(screen.getByText('20')).toBeDefined();
  });
});
