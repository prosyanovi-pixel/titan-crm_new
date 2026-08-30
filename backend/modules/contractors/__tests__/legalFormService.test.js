const db = require('../../../db');
const {
  getAll,
  getByCode,
  getTaxRegimesMapping,
  updateAllowedRegimes,
} = require('../services/legalFormService');

jest.mock('../../../db', () => ({
  query: jest.fn(),
}));

describe('Legal Form Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAll', () => {
    it('should return all transformed legal forms', async () => {
      const mockRows = [
        {
          id: 'ooo',
          name: 'ООО',
          description: 'Общество',
          isActive: true,
          groupId: 'legal',
          groupName: 'Юридические лица',
          groupDisplayOrder: 1,
          groupShowAsTab: true,
          createdAt: '2024-01-01',
          updatedAt: '2024-01-01',
        },
      ];

      db.query.mockResolvedValueOnce({ rows: mockRows });

      const result = await getAll();

      expect(db.query).toHaveBeenCalledWith(expect.stringContaining('SELECT f.*, g.name as group_name'));
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        code: 'ooo',
        name: 'ООО',
        description: 'Общество',
        isActive: true,
        groupId: 'legal',
        groupName: 'Юридические лица',
        groupDisplayOrder: 1,
        groupShowAsTab: true,
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
      });
    });
  });

  describe('getByCode', () => {
    it('should return a legal form by code', async () => {
      const mockRow = {
        id: 'ip',
        name: 'ИП',
        isActive: true,
      };

      db.query.mockResolvedValueOnce({ rows: [mockRow] });

      const result = await getByCode('ip');

      expect(db.query).toHaveBeenCalledWith(expect.any(String), ['ip']);
      expect(result.code).toBe('ip');
      expect(result.name).toBe('ИП');
    });

    it('should return null if form not found', async () => {
      db.query.mockResolvedValueOnce({ rows: [] });

      const result = await getByCode('unknown');

      expect(result).toBeNull();
    });
  });

  describe('getTaxRegimesMapping', () => {
    it('should map regimes to forms correctly', async () => {
      // Mock for getAll forms
      db.query.mockResolvedValueOnce({
        rows: [
          { id: 'ooo', name: 'ООО', groupId: 'legal' },
          { id: 'ip', name: 'ИП', groupId: 'individual' },
        ],
      });

      // Mock for regimes
      db.query.mockResolvedValueOnce({
        rows: [
          { id: 1, code: 'osn', name: 'ОСН', appliesToLegalForms: [] },
          { id: 2, code: 'usn', name: 'УСН', appliesToLegalForms: ['ip', 'ooo'] },
          { id: 3, code: 'npd', name: 'НПД', appliesToLegalForms: ['ip'] },
        ],
      });

      const mapping = await getTaxRegimesMapping();

      expect(mapping['ooo']).toBeDefined();
      expect(mapping['ip']).toBeDefined();

      const oooRegimes = mapping['ooo'].availableRegimes.map((r) => r.code);
      expect(oooRegimes).toContain('osn'); // applies to all
      expect(oooRegimes).toContain('usn'); // explicitly applies
      expect(oooRegimes).not.toContain('npd'); // does not apply to ooo

      const ipRegimes = mapping['ip'].availableRegimes.map((r) => r.code);
      expect(ipRegimes).toContain('osn');
      expect(ipRegimes).toContain('usn');
      expect(ipRegimes).toContain('npd');
    });

    it('should return mapping for specific code', async () => {
      db.query.mockResolvedValueOnce({ rows: [{ id: 'ip', name: 'ИП' }] }); // forms
      db.query.mockResolvedValueOnce({ rows: [] }); // regimes

      const mapping = await getTaxRegimesMapping('ip');

      expect(mapping).toBeDefined();
      expect(mapping.form.code).toBe('ip');
      expect(mapping.availableRegimes).toEqual([]);
    });

    it('should return null if specific code not found', async () => {
      db.query.mockResolvedValueOnce({ rows: [] }); // forms
      db.query.mockResolvedValueOnce({ rows: [] }); // regimes

      const mapping = await getTaxRegimesMapping('unknown');

      expect(mapping).toBeNull();
    });
  });

  describe('updateAllowedRegimes', () => {
    it('should throw if form not found', async () => {
      db.query.mockResolvedValueOnce({ rows: [] }); // getByCode

      await expect(updateAllowedRegimes('unknown', [1])).rejects.toThrow('не найдена');
    });

    it('should throw if regimes not found', async () => {
      db.query.mockResolvedValueOnce({ rows: [{ id: 'ip' }] }); // getByCode
      db.query.mockResolvedValueOnce({ rows: [] }); // regimes check

      await expect(updateAllowedRegimes('ip', [999])).rejects.toThrow('не найдены');
    });

    it('should return info object on successful check', async () => {
      db.query.mockResolvedValueOnce({ rows: [{ id: 'ip' }] }); // getByCode
      db.query.mockResolvedValueOnce({ rows: [{ id: 1 }] }); // regimes check

      // getTaxRegimesMapping mocks
      db.query.mockResolvedValueOnce({ rows: [{ id: 'ip' }] }); // getAll
      db.query.mockResolvedValueOnce({ rows: [{ id: 1, appliesToLegalForms: [] }] }); // regimes

      const result = await updateAllowedRegimes('ip', [1]);

      expect(result.form.code).toBe('ip');
      expect(result.updatedRegimeIds).toEqual([1]);
      expect(result.previousRegimeIds).toEqual([1]);
      expect(result.message).toContain('Внимание');
    });
  });
});
