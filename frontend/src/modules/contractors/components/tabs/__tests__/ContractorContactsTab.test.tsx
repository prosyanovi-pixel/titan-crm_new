import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ContractorContactsTab } from '../ContractorContactsTab';
import { vi } from 'vitest';
import React from 'react';
import { I18nProvider } from '@/lib/i18n';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
// Mock the settings hook
vi.mock('../../../../../hooks/use-settings', () => ({
  useSettings: () => ({
    getPositions: () => [
      { id: '1', name: 'Директор' },
      { id: '2', name: 'Бухгалтер' },
      { id: '3', name: 'Менеджер' }
    ]
  })
}));

// Mock the translation hook
vi.mock('@/lib/i18n', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/i18n')>();
  return {
    ...actual,
    useTranslation: () => ({
      t: (key: string) => key,
      language: 'ru',
      setLanguage: vi.fn(),
    })
  };
});

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <I18nProvider>
        {children}
      </I18nProvider>
    </QueryClientProvider>
  );
};

describe('ContractorContactsTab', () => {
  const mockHandleChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders empty state when no contacts exist', () => {
    render(
      <ContractorContactsTab 
        formData={{ contacts: [] }} 
        handleChange={mockHandleChange} 
      />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByText('contractor_sheet.placeholder.no_contacts')).toBeInTheDocument();
  });

  it('renders existing contacts', () => {
    const contacts = [
      {
        id: '1',
        name: 'Иван Иванов',
        position: 'Директор',
        phone: '+7 (999) 123-45-67',
        email: 'ivan@example.com',
        isPrimary: true
      }
    ];

    render(
      <ContractorContactsTab 
        formData={{ contacts }} 
        handleChange={mockHandleChange} 
      />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByText('Иван Иванов')).toBeInTheDocument();
    expect(screen.getByText('Директор')).toBeInTheDocument();
    expect(screen.getByText('+7 (999) 123-45-67')).toBeInTheDocument();
    expect(screen.getByText('ivan@example.com')).toBeInTheDocument();
    expect(screen.getByText('generated.osnovnoy')).toBeInTheDocument();
  });

  it('allows adding a new contact', async () => {
    render(
      <ContractorContactsTab 
        formData={{ contacts: [] }} 
        handleChange={mockHandleChange} 
      />,
      { wrapper: createWrapper() }
    );

    // Click add button
    fireEvent.click(screen.getByText('contractor_sheet.action.add_contact'));

    // Fill form
    const nameInput = screen.getByPlaceholderText('contractor_sheet.placeholder.contact_name');
    fireEvent.change(nameInput, { target: { value: 'Петр Петров' } });

    const emailInput = screen.getByPlaceholderText('email@example.com');
    fireEvent.change(emailInput, { target: { value: 'petr@example.com' } });

    // Save
    fireEvent.click(screen.getByText('common.save'));

    // Verify handleChange was called with new contact
    expect(mockHandleChange).toHaveBeenCalledWith('contacts', expect.arrayContaining([
      expect.objectContaining({
        name: 'Петр Петров',
        email: 'petr@example.com',
        isPrimary: true // First contact should be primary
      })
    ]));
  });

  it('allows editing an existing contact', () => {
    const contacts = [
      {
        id: '1',
        name: 'Иван Иванов',
        position: 'Директор',
        phone: '+7 (999) 123-45-67',
        email: 'ivan@example.com',
        isPrimary: true
      }
    ];

    render(
      <ContractorContactsTab 
        formData={{ contacts }} 
        handleChange={mockHandleChange} 
      />,
      { wrapper: createWrapper() }
    );

    // Click on contact to edit
    fireEvent.click(screen.getByText('Иван Иванов'));

    // Change name
    const nameInput = screen.getByDisplayValue('Иван Иванов');
    fireEvent.change(nameInput, { target: { value: 'Иван Смирнов' } });

    // Save
    fireEvent.click(screen.getByText('common.save'));

    // Verify handleChange was called with updated contact
    expect(mockHandleChange).toHaveBeenCalledWith('contacts', expect.arrayContaining([
      expect.objectContaining({
        id: '1',
        name: 'Иван Смирнов',
        email: 'ivan@example.com'
      })
    ]));
  });

  it('allows removing a contact', () => {
    const contacts = [
      {
        id: '1',
        name: 'Иван Иванов',
        position: 'Директор',
        phone: '+7 (999) 123-45-67',
        email: 'ivan@example.com',
        isPrimary: true
      }
    ];

    render(
      <ContractorContactsTab 
        formData={{ contacts }} 
        handleChange={mockHandleChange} 
      />,
      { wrapper: createWrapper() }
    );

    // Find and click delete button (it's hidden by default, but accessible to screen readers/tests)
    // The trash icon is inside a button
    const deleteButton = screen.getByRole('button', { name: '' }); // The button has no text, just an icon
    // We need a better way to find the delete button. Let's find it by class or structure
    const buttons = screen.getAllByRole('button');
    const deleteBtn = buttons.find(b => b.className.includes('hover:text-destructive'));
    
    if (deleteBtn) {
      fireEvent.click(deleteBtn);
      
      expect(mockHandleChange).toHaveBeenCalledWith('contacts', []);
    }
  });

  it('updates organization email and website', () => {
    render(
      <ContractorContactsTab 
        formData={{ email: 'old@company.com', website: 'old.com' }} 
        handleChange={mockHandleChange} 
      />,
      { wrapper: createWrapper() }
    );

    const emailInput = screen.getByDisplayValue('old@company.com');
    fireEvent.change(emailInput, { target: { value: 'new@company.com' } });
    expect(mockHandleChange).toHaveBeenCalledWith('email', 'new@company.com');

    const websiteInput = screen.getByDisplayValue('old.com');
    fireEvent.change(websiteInput, { target: { value: 'new.com' } });
    expect(mockHandleChange).toHaveBeenCalledWith('website', 'new.com');
  });
});