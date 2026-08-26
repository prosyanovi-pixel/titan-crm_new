/**
 * Integration tests for Titan CRM API
 * 
 * These tests verify API endpoints work correctly with the database.
 * Run with: npm run test:api
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { api } from '@/lib/api';

// Test data
const testContractor = {
  name: `Test Contractor ${Date.now()}`,
  inn: '1234567890',
  type: 'client' as const,
};

describe('Contractors API', () => {
  let createdId: number | null = null;

  it('should get all contractors', async () => {
    const response = await api.get('/contractors');
    const contractors = Array.isArray(response) ? response : response.data;
    expect(Array.isArray(contractors)).toBe(true);
  });

  it('should create a new contractor', async () => {
    const contractor = await api.post('/contractors', testContractor);
    expect(contractor).toBeDefined();
    expect(contractor.name).toBe(testContractor.name);
    createdId = contractor.id;
  });

  it('should get contractor by id', async () => {
    if (!createdId) return;
    
    const contractor = await api.get(`/contractors/${createdId}`);
    expect(contractor).toBeDefined();
    expect(contractor.id).toBe(createdId);
  });

  it('should update contractor', async () => {
    if (!createdId) return;
    
    const updated = await api.put(`/contractors/${createdId}`, {
      ...testContractor,
      name: `${testContractor.name} - Updated`,
    });
    
    expect(updated.name).toContain('Updated');
  });

  it('should delete contractor', async () => {
    if (!createdId) return;
    
    await api.delete(`/contractors/${createdId}`);
    
    // Verify deletion
    try {
      await api.get(`/contractors/${createdId}`);
    } catch (error: unknown) {
      expect((error as { status?: number }).status).toBe(404);
    }
  });
});

describe('Projects API', () => {
  let createdId: number | null = null;

  it('should get all projects', async () => {
    const response = await api.get('/projects');
    const projects = Array.isArray(response) ? response : response.data;
    expect(Array.isArray(projects)).toBe(true);
  });

  it('should create a new project', async () => {
    const project = await api.post('/projects', {
      name: `Test Project ${Date.now()}`,
      status: 'active',
      priority: 'medium',
    });
    
    expect(project).toBeDefined();
    expect(project.name).toContain('Test Project');
    createdId = project.id;
  });

  it('should update project status', async () => {
    if (!createdId) return;
    
    const updated = await api.put(`/projects/${createdId}`, {
      status: 'completed',
    });
    
    expect(updated.status).toBe('completed');
  });

  it('should delete project', async () => {
    if (!createdId) return;
    
    await api.delete(`/projects/${createdId}`);
  });
});

describe('Tasks API', () => {
  let createdId: string | null = null;

  it('should get all tasks', async () => {
    const response = await api.get('/tasks');
    const tasks = Array.isArray(response) ? response : response.data;
    expect(Array.isArray(tasks)).toBe(true);
  });

  it('should create a new task', async () => {
    const task = await api.post('/tasks', {
      title: `Test Task ${Date.now()}`,
      status: 'todo',
      priority: 'medium',
    });
    
    expect(task).toBeDefined();
    expect(task.title).toContain('Test Task');
    createdId = task.id;
  });

  it('should update task status', async () => {
    if (!createdId) return;
    
    const updated = await api.put(`/tasks/${createdId}`, {
      status: 'in_progress',
    });
    
    expect(updated.status).toBe('in_progress');
  });

  it('should delete task', async () => {
    if (!createdId) return;
    
    await api.delete(`/tasks/${createdId}`);
  });
});

describe('Finance API', () => {
  let createdInvoiceId: number | null = null;

  it('should get all invoices', async () => {
    const response = await api.get('/finance/invoices');
    const invoices = Array.isArray(response) ? response : response.data;
    expect(Array.isArray(invoices)).toBe(true);
  });

  it('should create a new invoice', async () => {
    const invoice = await api.post('/finance/invoices', {
      title: `Test Invoice ${Date.now()}`,
      amount_total: 1000,
      status: 'draft',
      invoice_type: 'outgoing',
      currency: 'RUB',
      issue_date: new Date().toISOString().split('T')[0],
      due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    });
    
    expect(invoice).toBeDefined();
    expect(invoice.title).toContain('Test Invoice');
    createdInvoiceId = invoice.id;
  });

  it('should update invoice status', async () => {
    if (!createdInvoiceId) return;
    
    const updated = await api.put(`/finance/invoices/${createdInvoiceId}`, {
      status: 'sent',
    });
    
    expect(updated.status).toBe('sent');
  });

  it('should delete invoice', async () => {
    if (!createdInvoiceId) return;
    
    await api.delete(`/finance/invoices/${createdInvoiceId}`);
  });

  it('should get payments', async () => {
    const response = await api.get('/finance/payments');
    const payments = Array.isArray(response) ? response : response.data;
    expect(Array.isArray(payments)).toBe(true);
  });
});

describe('Users API', () => {
  it('should get all users', async () => {
    const response = await api.get('/admin/users');
    const users = Array.isArray(response) ? response : response.data;
    expect(Array.isArray(users)).toBe(true);
    expect(users.length).toBeGreaterThan(0);
  });

  it('should get current user profile', async () => {
    const profile = await api.get('/profile');
    expect(profile).toBeDefined();
    expect(profile.name).toBeDefined();
  });
});

describe('Settings API', () => {
  it('should get module settings', async () => {
    const settings = await api.get('/module-settings');
    expect(Array.isArray(settings)).toBe(true);
  });

  it('should get user settings', async () => {
    const settings = await api.get('/user-settings');
    expect(Array.isArray(settings)).toBe(true);
  });

  it('should create user setting', async () => {
    const setting = await api.post('/user-settings', {
      key: `test-setting-${Date.now()}`,
      value: { test: 'value' },
    });
    
    expect(setting).toBeDefined();
    expect(setting.key).toContain('test-setting');
  });
});

describe('Auth API', () => {
  it('should fail login with invalid credentials', async () => {
    try {
      await api.post('/auth/login', {
        nickname: 'invalid_user',
        password: 'wrong_password',
      });
      expect.fail('Should have thrown');
    } catch (error: unknown) {
      expect((error as { status?: number }).status).toBe(401);
    }
  });

  it('should get roles', async () => {
    const roles = await api.get('/roles');
    expect(Array.isArray(roles)).toBe(true);
  });
});

describe('References API', () => {
  it('should get all references', async () => {
    const references = await api.get('/references');
    expect(references).toBeDefined();
    expect(references.projectStatuses).toBeDefined();
    expect(references.priorities).toBeDefined();
  });

  it('should get statuses', async () => {
    const response = await api.get('/statuses');
    const items = Array.isArray(response) ? response : (response.items || response.data);
    expect(Array.isArray(items)).toBe(true);
  });

  it('should get tags', async () => {
    const response = await api.get('/tags');
    const items = Array.isArray(response) ? response : (response.items || response.data);
    expect(Array.isArray(items)).toBe(true);
  });

  it('should get priorities', async () => {
    const response = await api.get('/priorities');
    const items = Array.isArray(response) ? response : (response.items || response.data);
    expect(Array.isArray(items)).toBe(true);
  });
});

describe('Documents API', () => {
  it('should get all documents', async () => {
    const documents = await api.get('/files');
    expect(Array.isArray(documents)).toBe(true);
  });

  it('should get folder stats', async () => {
    const stats = await api.get('/files/stats');
    expect(stats).toBeDefined();
    expect(stats.used).toBeDefined();
    expect(stats.total).toBeDefined();
  });
});

describe('Calendar API', () => {
  it('should get calendar events', async () => {
    const events = await api.get('/calendar-events');
    expect(Array.isArray(events)).toBe(true);
  });

  it('should create calendar event', async () => {
    const event = await api.post('/calendar-events', {
      title: `Test Event ${Date.now()}`,
      start_date: new Date().toISOString(),
      end_date: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      type: 'meeting',
    });
    
    expect(event).toBeDefined();
    expect(event.title).toContain('Test Event');
    
    // Cleanup
    if (event.id) {
      await api.delete(`/calendar-events/${event.id}`);
    }
  });
});

describe('Legal Cases API', () => {
  it('should get legal cases', async () => {
    const cases = await api.get('/legal-cases');
    expect(Array.isArray(cases)).toBe(true);
  });

  it('should get lawyers', async () => {
    const lawyers = await api.get('/lawyers');
    expect(Array.isArray(lawyers)).toBe(true);
  });
});

describe('Error Handling', () => {
  it('should handle 404 errors', async () => {
    try {
      await api.get('/nonexistent-endpoint');
      expect.fail('Should have thrown');
    } catch (error: unknown) {
      expect((error as { status?: number }).status).toBe(404);
    }
  });

  it('should handle 403 errors', async () => {
    try {
      // Try to access admin endpoint without proper permissions
      await api.delete('/admin/users/1');
      expect.fail('Should have thrown');
    } catch (error: unknown) {
      expect([403, 401]).toContain((error as { status?: number }).status);
    }
  });
});
