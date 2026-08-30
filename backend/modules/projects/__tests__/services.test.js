/**
 * Тесты для сервисов модуля Projects
 */

// Mock database (must be set before requiring modules that use `db`)
jest.mock('../../../db', () => ({ query: jest.fn() }));
const mockDb = require('../../../db');

const {
  transformProject,
  getAllProjects,
  getProjectById,
  getProjectStats,
  createProject,
  updateProject,
  deleteProject,
  bulkUpdateProjects,
} = require('../services/projectService');

const {
  loadFinanceInfo,
  calculateProjectFinance,
  getProjectFinanceData,
  loadFinanceForProjects,
} = require('../services/financeService');

describe('Project Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('transformProject', () => {
    it('should transform project with formatted date', () => {
      const project = {
        id: 1,
        name: 'Test Project',
        deadline: '2024-01-15',
      };

      const result = transformProject(project);

      expect(result).toEqual({
        ...project,
        deadline: expect.any(String),
      });
    });

    it('should return null for null input', () => {
      expect(transformProject(null)).toBeNull();
    });

    it('should return undefined for undefined input', () => {
      expect(transformProject(undefined)).toBeUndefined();
    });
  });

  describe('getProjectStats', () => {
    it('should return project statistics', async () => {
      mockDb.query.mockResolvedValue({
        rows: [{
          total: 10,
          active: 5,
          completed: 3,
          pending: 1,
          paused: 1,
          total_budget: 1000000,
          active_budget: 500000,
          total_tasks: 50,
          completed_tasks: 30,
        }],
      });

      const stats = await getProjectStats();

      expect(stats).toEqual({
        total: 10,
        active: 5,
        completed: 3,
        pending: 1,
        paused: 1,
        totalBudget: 1000000,
        activeBudget: 500000,
        totalTasks: 50,
        completedTasks: 30,
        completionRate: 60,
      });
    });

    it('should handle empty database', async () => {
      mockDb.query.mockResolvedValue({
        rows: [{
          total: 0,
          active: 0,
          completed: 0,
          pending: 0,
          paused: 0,
          total_budget: 0,
          active_budget: 0,
          total_tasks: 0,
          completed_tasks: 0,
        }],
      });

      const stats = await getProjectStats();

      expect(stats).toEqual({
        total: 0,
        active: 0,
        completed: 0,
        pending: 0,
        paused: 0,
        totalBudget: 0,
        activeBudget: 0,
        totalTasks: 0,
        completedTasks: 0,
        completionRate: 0,
      });
    });
  });

  describe('createProject', () => {
    it('should create a new project', async () => {
      const newProjectData = {
        name: 'New Project',
        client: 'Test Client',
        manager: 'John Doe',
        status: 'pending',
        budget: 100000,
      };

      mockDb.query
        .mockResolvedValueOnce({ rows: [{ nextId: 1 }] }) // Get next ID
        .mockResolvedValueOnce({ // Insert and return
          rows: [{
            id: 1,
            ...newProjectData,
            deadline: null,
          }],
        });

      const result = await createProject(newProjectData);

      expect(result).toEqual({
        id: 1,
        ...newProjectData,
        hasOverdueInvoice: false,
        financeStatus: null,
        totalPaid: 0,
        totalExpenses: 0,
        budgetUsedPercent: 0,
        tags: [],
      });
    });
  });

  describe('updateProject', () => {
    it('should update existing project', async () => {
      const updateData = {
        name: 'Updated Project',
        status: 'active',
      };

      mockDb.query
        .mockResolvedValueOnce({ // SELECT status (oldProject)
          rows: [{ status: 'pending' }],
        })
        .mockResolvedValueOnce({ // Update
          rows: [{ id: 1 }],
        })
        .mockResolvedValueOnce({ // getProjectById: SELECT p.*
          rows: [{
            id: 1,
            name: 'Updated Project',
            status: 'active',
            budget: 100000,
          }],
        })
        .mockResolvedValueOnce({ // loadFinanceInfo
          rows: [{ hasOverdueInvoice: false, financeStatus: null }],
        })
        .mockResolvedValueOnce({ // calculateProjectFinance: totalPaid
          rows: [{ totalPaid: 50000 }],
        })
        .mockResolvedValueOnce({ // calculateProjectFinance: directIncome
          rows: [{ directIncome: 0 }],
        })
        .mockResolvedValueOnce({ // calculateProjectFinance: projectIncome
          rows: [{ projectIncome: 0 }],
        })
        .mockResolvedValueOnce({ // calculateProjectFinance: totalExpenses
          rows: [{ totalExpenses: 30000 }],
        })
        .mockResolvedValueOnce({ // calculateProjectFinance: projectExpenses
          rows: [{ projectExpenses: 0 }],
        })
        .mockResolvedValueOnce({ // getProjectById: tags
          rows: [],
        });

      const result = await updateProject(1, updateData);

      expect(result).toBeDefined();
      expect(result.name).toBe('Updated Project');
      expect(result.status).toBe('active');
    });

    it('should return null for non-existent project', async () => {
      mockDb.query.mockResolvedValueOnce({ rows: [] });

      const result = await updateProject(999, { name: 'Test' });

      expect(result).toBeNull();
    });
  });

  describe('deleteProject', () => {
    it('should delete project successfully', async () => {
      mockDb.query.mockResolvedValueOnce({ rowCount: 1 });

      const result = await deleteProject(1);

      expect(result).toBe(true);
    });

    it('should return false for non-existent project', async () => {
      mockDb.query.mockResolvedValueOnce({ rowCount: 0 });

      const result = await deleteProject(999);

      expect(result).toBe(false);
    });
  });

  describe('bulkUpdateProjects', () => {
    it('should update multiple projects', async () => {
      const ids = [1, 2, 3];
      const field = 'status';
      const value = 'active';

      mockDb.query.mockResolvedValueOnce({
        rows: ids.map(id => ({
          id,
          name: `Project ${id}`,
          status: value,
          budget: 100000,
        })),
      });

      const result = await bulkUpdateProjects(ids, field, value);

      expect(result).toHaveLength(3);
      expect(result.every(p => p.status === 'active')).toBe(true);
    });

    it('should throw error for invalid field', async () => {
      await expect(bulkUpdateProjects([1], 'invalid_field', 'value'))
        .rejects.toThrow('Invalid field for bulk update');
    });
  });
});

describe('Finance Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('loadFinanceInfo', () => {
    it('should load finance info for project', async () => {
      mockDb.query.mockResolvedValue({
        rows: [{
          hasOverdueInvoice: true,
          financeStatus: 'overdue',
        }],
      });

      const result = await loadFinanceInfo(1);

      expect(result).toEqual({
        hasOverdueInvoice: true,
        financeStatus: 'overdue',
      });
    });

    it('should handle errors gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      mockDb.query.mockRejectedValue(new Error('DB error'));

      const result = await loadFinanceInfo(1);

      expect(result).toEqual({
        hasOverdueInvoice: false,
        financeStatus: null,
      });
      consoleSpy.mockRestore();
    });
  });

  describe('calculateProjectFinance', () => {
    it('should calculate project finance correctly', async () => {
      mockDb.query
        .mockResolvedValueOnce({ rows: [{ totalPaid: 50000 }] })
        .mockResolvedValueOnce({ rows: [{ directIncome: 10000 }] })
        .mockResolvedValueOnce({ rows: [{ projectIncome: 0 }] })
        .mockResolvedValueOnce({ rows: [{ totalExpenses: 30000 }] })
        .mockResolvedValueOnce({ rows: [{ projectExpenses: 0 }] });

      const result = await calculateProjectFinance(1, 100000);

      expect(result).toEqual({
        totalPaid: 60000,
        totalExpenses: 30000,
        budgetUsedPercent: 30,
      });
    });

    it('should handle zero budget', async () => {
      mockDb.query
        .mockResolvedValueOnce({ rows: [{ totalPaid: 0 }] })
        .mockResolvedValueOnce({ rows: [{ directIncome: 0 }] })
        .mockResolvedValueOnce({ rows: [{ projectIncome: 0 }] })
        .mockResolvedValueOnce({ rows: [{ totalExpenses: 0 }] })
        .mockResolvedValueOnce({ rows: [{ projectExpenses: 0 }] });

      const result = await calculateProjectFinance(1, 0);

      expect(result).toEqual({
        totalPaid: 0,
        totalExpenses: 0,
        budgetUsedPercent: 0,
      });
    });
  });
});
