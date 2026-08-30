const controllers = require('../controllers');
const db = require('../../../db');
const { sendSuccess } = require('../../../utils/responseHelpers');

jest.mock('../../../db');
jest.mock('../../../utils/responseHelpers');

describe('Dashboard Controllers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Helpers', () => {
    it('should format currency correctly', () => {
      expect(controllers.formatCurrency(500)).toBe('500 ₽');
      expect(controllers.formatCurrency(1500)).toBe('1.5K ₽');
      expect(controllers.formatCurrency(2500000)).toBe('2.5M ₽');
    });

    it('should normalize project status', () => {
      expect(controllers.normalizeProjectStatus('active')).toBe('В работе');
      expect(controllers.normalizeProjectStatus('pending')).toBe('Ожидание');
      expect(controllers.normalizeProjectStatus('finished')).toBe('Завершена');
      expect(controllers.normalizeProjectStatus('paused')).toBe('Приостановлена');
      expect(controllers.normalizeProjectStatus('unknown')).toBe('unknown');
    });

    it('should get priority name', () => {
      expect(controllers.getPriorityName('high')).toBe('Высокий');
      expect(controllers.getPriorityName('medium')).toBe('Средний');
      expect(controllers.getPriorityName('low')).toBe('Низкий');
      expect(controllers.getPriorityName('unknown')).toBe('unknown');
    });
  });

  describe('getStats', () => {
    it('should get dashboard stats', async () => {
      // Mock db queries
      db.query
        .mockResolvedValueOnce({ rows: [{ count: 10 }] }) // contractors
        .mockResolvedValueOnce({ rows: [{ count: 20 }] }) // total projects
        .mockResolvedValueOnce({ rows: [{ count: 15 }] }) // active projects
        .mockResolvedValueOnce({ rows: [{ total: 5000 }] }) // turnover
        .mockResolvedValueOnce({ rows: [{ count: 100 }] }) // total tasks count
        .mockResolvedValueOnce({ rows: [{ id: 1, title: 'Project 1', status: 'active', date: new Date(), type: 'project' }] }) // recent projects
        .mockResolvedValueOnce({ rows: [{ id: 1, title: 'Contractor 1', status: 'active', date: new Date(), type: 'contractor' }] }) // recent contractors
        .mockResolvedValueOnce({ rows: [{ id: 1, title: 'Upcoming 1', deadline: new Date(), priority: 'high', status: 'active' }] }) // upcoming projects
        .mockResolvedValueOnce({ rows: [{ count: 5 }] }) // new clients
        .mockResolvedValueOnce({ rows: [{ total_tasks: 100, completed_tasks: 50 }] }); // efficiency

      const req = {};
      const res = {};

      await controllers.getStats(req, res);

      expect(sendSuccess).toHaveBeenCalled();
    });
  });
});
