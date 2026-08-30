const db = require('../../../db');
const {
  fetchStatuses,
  fetchTags,
  fetchPriorities,
  getAllReferenceData
} = require('../services/referenceData');

jest.mock('../../../db', () => ({
  query: jest.fn()
}));

describe('Reference Data Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('fetchStatuses', () => {
    it('should fetch statuses for a specific module', async () => {
      db.query.mockResolvedValueOnce({
        rows: [{ id: 1, name: 'Active', displayorder: 1 }]
      });

      const result = await fetchStatuses('contractors');

      expect(db.query).toHaveBeenCalledWith(expect.stringContaining('contractor_status'));
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Active');
      expect(result[0].module).toBe('contractors');
    });

    it('should return empty array if module table not found', async () => {
      const result = await fetchStatuses('unknown_module');
      expect(result).toEqual([]);
      expect(db.query).not.toHaveBeenCalled();
    });

    it('should fetch all statuses if module not provided', async () => {
      // It iterates through all 9 modules
      db.query.mockResolvedValue({
        rows: [{ id: 1, name: 'Active', displayorder: 1 }]
      });

      const result = await fetchStatuses();

      expect(db.query).toHaveBeenCalledTimes(9); 
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('fetchTags', () => {
    it('should fetch all tags if no module specified', async () => {
      db.query.mockResolvedValueOnce({
        rows: [{ id: 1, name: 'VIP', color: '#000' }]
      });

      const result = await fetchTags();

      expect(db.query).toHaveBeenCalledWith(expect.stringContaining('SELECT * FROM defined_tags'), []);
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('VIP');
    });

    it('should fetch tags for specific module', async () => {
      db.query.mockResolvedValueOnce({ rows: [] });

      await fetchTags('projects');

      expect(db.query).toHaveBeenCalledWith(expect.stringContaining('WHERE module = $1'), ['projects']);
    });
  });

  describe('fetchPriorities', () => {
    it('should map priorities correctly', async () => {
      db.query.mockResolvedValueOnce({
        rows: [{ id: 'High', name: 'High Priority', displayorder: 1 }]
      });

      const result = await fetchPriorities();

      expect(result).toHaveLength(1);
      expect(result[0].level).toBe(3); // from levelMap
      expect(result[0].color).toBe('#EF4444'); // default for High
    });
  });

  describe('getAllReferenceData', () => {
    it('should call all fetch methods and aggregate data', async () => {
      db.query.mockResolvedValue({ rows: [] }); // mock for all

      const result = await getAllReferenceData();

      expect(result).toHaveProperty('statuses');
      expect(result).toHaveProperty('tags');
      expect(result).toHaveProperty('priorities');
      expect(result).toHaveProperty('projectStages');
      expect(result).toHaveProperty('taxRegimes');
      expect(result).toHaveProperty('relationshipTypes');
      expect(result).toHaveProperty('contractorTypes');
      expect(result).toHaveProperty('marketingStatuses');
      expect(result).toHaveProperty('marketingTypes');
    });
  });
});
