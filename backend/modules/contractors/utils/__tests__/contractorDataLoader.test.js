/**
 * Unit tests для contractorDataLoader.js
 * Тестирует батч-загрузку, кэширование и обогащение данных
 */

// Mock db module (must be before requiring the module under test)
jest.mock('../../../../db', () => ({
  query: jest.fn(),
}));
const db = require('../../../../db');

const {
  batchLoadContractorRelations,
  loadReferences,
  clearReferenceCache,
  enrichContractorsWithReferences,
  loadFullContractorsData
} = require('../contractorDataLoader');

describe('contractorDataLoader', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    clearReferenceCache();
  });

  afterEach(() => {
    clearReferenceCache();
  });

  describe('batchLoadContractorRelations', () => {
    it('should batch load tags for multiple contractors', async () => {
      const mockTags = [
        { contractor_id: 1, tag: 'tag1' },
        { contractor_id: 1, tag: 'tag2' },
        { contractor_id: 2, tag: 'tag3' },
      ];

      jest.mocked(db.query).mockResolvedValueOnce({ rows: mockTags });
      jest.mocked(db.query).mockResolvedValueOnce({ rows: [] }); // bankAccounts
      jest.mocked(db.query).mockResolvedValueOnce({ rows: [] }); // contacts
      jest.mocked(db.query).mockResolvedValueOnce({ rows: [] }); // documents

      const result = await batchLoadContractorRelations([1, 2]);

      expect(result.tags).toEqual({
        1: ['tag1', 'tag2'],
        2: ['tag3'],
      });

      // Проверяем что был использован WHERE ... ANY()
      const queryCall = jest.mocked(db.query).mock.calls[0];
      expect(queryCall[1][0]).toContain(1);
      expect(queryCall[1][0]).toContain(2);
    });

    it('should batch load bank accounts', async () => {
      const mockBanks = [
        { contractor_id: 1, id: 'ba-1', bankName: 'Bank1', bik: '044525225' },
        { contractor_id: 2, id: 'ba-2', bankName: 'Bank2', bik: '044525226' },
      ];

      jest.mocked(db.query).mockResolvedValueOnce({ rows: [] }); // tags
      jest.mocked(db.query).mockResolvedValueOnce({ rows: mockBanks });
      jest.mocked(db.query).mockResolvedValueOnce({ rows: [] }); // contacts
      jest.mocked(db.query).mockResolvedValueOnce({ rows: [] }); // documents

      const result = await batchLoadContractorRelations([1, 2]);

      expect(result.bankAccounts).toEqual({
        1: [mockBanks[0]],
        2: [mockBanks[1]],
      });
    });

    it('should batch load contacts', async () => {
      const mockContacts = [
        { contractor_id: 1, id: 'cc-1', name: 'Contact1', email: 'c1@test.com' },
        { contractor_id: 1, id: 'cc-2', name: 'Contact2', email: 'c2@test.com' },
      ];

      jest.mocked(db.query).mockResolvedValueOnce({ rows: [] }); // tags
      jest.mocked(db.query).mockResolvedValueOnce({ rows: [] }); // bankAccounts
      jest.mocked(db.query).mockResolvedValueOnce({ rows: mockContacts });
      jest.mocked(db.query).mockResolvedValueOnce({ rows: [] }); // documents

      const result = await batchLoadContractorRelations([1]);

      expect(result.contacts).toEqual({
        1: mockContacts,
      });
    });

    it('should return empty objects for empty input', async () => {
      const result = await batchLoadContractorRelations([]);

      expect(result).toEqual({
        tags: {},
        bankAccounts: {},
        contacts: {},
        documents: {},
      });

      // db.query should not be called
      expect(jest.mocked(db.query)).not.toHaveBeenCalled();
    });

    it('should handle null input gracefully', async () => {
      const result = await batchLoadContractorRelations(null);

      expect(result).toEqual({
        tags: {},
        bankAccounts: {},
        contacts: {},
        documents: {},
      });
    });
  });

  describe('loadReferences', () => {
    it('should load managers, statuses, and types in one batch', async () => {
      const mockManagers = [
        { id: 1, name: 'Manager1' },
        { id: 2, name: 'Manager2' },
      ];
      const mockStatuses = [
        { id: 'active', name: 'Active' },
        { id: 'pending', name: 'Pending' },
      ];
      const mockTypes = [
        { id: 'client', name: 'Client' },
        { id: 'partner', name: 'Partner' },
      ];

      jest.mocked(db.query)
        .mockResolvedValueOnce({ rows: mockManagers })
        .mockResolvedValueOnce({ rows: mockStatuses })
        .mockResolvedValueOnce({ rows: mockTypes });

      const result = await loadReferences();

      expect(result.managers).toEqual({
        1: 'Manager1',
        '1': 'Manager1',
        2: 'Manager2',
        '2': 'Manager2',
      });

      expect(result.statuses).toEqual({
        'active': 'Active',
        active: 'Active',
        'pending': 'Pending',
        pending: 'Pending',
      });

      expect(result.types).toEqual({
        'client': 'Client',
        client: 'Client',
        'partner': 'Partner',
        partner: 'Partner',
      });

      // Should make 3 queries
      expect(jest.mocked(db.query)).toHaveBeenCalledTimes(3);
    });

    it('should cache references on second call', async () => {
      const mockManagers = [{ id: 1, name: 'Manager1' }];
      const mockStatuses = [{ id: 'active', name: 'Active' }];
      const mockTypes = [{ id: 'client', name: 'Client' }];

      jest.mocked(db.query)
        .mockResolvedValueOnce({ rows: mockManagers })
        .mockResolvedValueOnce({ rows: mockStatuses })
        .mockResolvedValueOnce({ rows: mockTypes });

      // First call
      await loadReferences();
      expect(jest.mocked(db.query)).toHaveBeenCalledTimes(3);

      // Second call (should use cache)
      const result = await loadReferences();
      expect(jest.mocked(db.query)).toHaveBeenCalledTimes(3); // No additional calls

      expect(result.managers[1]).toBe('Manager1');
    });

    it('should clear cache properly', async () => {
      const mockManagers = [{ id: 1, name: 'Manager1' }];
      const mockStatuses = [{ id: 'active', name: 'Active' }];
      const mockTypes = [{ id: 'client', name: 'Client' }];

      jest.mocked(db.query)
        .mockResolvedValueOnce({ rows: mockManagers })
        .mockResolvedValueOnce({ rows: mockStatuses })
        .mockResolvedValueOnce({ rows: mockTypes })
        .mockResolvedValueOnce({ rows: mockManagers })
        .mockResolvedValueOnce({ rows: mockStatuses })
        .mockResolvedValueOnce({ rows: mockTypes });

      // Load, clear, load again
      await loadReferences();
      clearReferenceCache();
      await loadReferences();

      // Should have made 6 calls (3 + 3)
      expect(jest.mocked(db.query)).toHaveBeenCalledTimes(6);
    });
  });

  describe('enrichContractorsWithReferences', () => {
    it('should enrich contractors with manager names', () => {
      const contractors = [
        { id: 1, manager: 1, status: 'active', type: 'client' },
        { id: 2, manager: 2, status: 'pending', type: 'partner' },
      ];

      const references = {
        managers: { 1: 'John Doe', '1': 'John Doe', 2: 'Jane Smith', '2': 'Jane Smith' },
        statuses: { 'active': 'Active', active: 'Active', 'pending': 'Pending', pending: 'Pending' },
        types: { 'client': 'Client', client: 'Client', 'partner': 'Partner', partner: 'Partner' },
      };

      const result = enrichContractorsWithReferences(contractors, references);

      expect(result[0].manager).toBe('John Doe');
      expect(result[1].manager).toBe('Jane Smith');
    });

    it('should add status names', () => {
      const contractors = [
        { id: 1, manager: 1, status: 'active', type: 'client' },
      ];

      const references = {
        managers: { 1: 'John Doe', '1': 'John Doe' },
        statuses: { 'active': 'Active', active: 'Active' },
        types: { 'client': 'Client', client: 'Client' },
      };

      const result = enrichContractorsWithReferences(contractors, references);

      expect(result[0].statusName).toBe('Active');
    });

    it('should add type names', () => {
      const contractors = [
        { id: 1, manager: 1, status: 'active', type: 'client' },
      ];

      const references = {
        managers: { 1: 'John Doe', '1': 'John Doe' },
        statuses: { 'active': 'Active', active: 'Active' },
        types: { 'client': 'Client', client: 'Client' },
      };

      const result = enrichContractorsWithReferences(contractors, references);

      expect(result[0].typeName).toBe('Client');
    });

    it('should handle missing references gracefully', () => {
      const contractors = [
        { id: 1, manager: 999, status: 'unknown', type: 'unknown' },
      ];

      const references = {
        managers: {},
        statuses: {},
        types: {},
      };

      const result = enrichContractorsWithReferences(contractors, references);

      expect(result[0].manager).toBe('999');
      expect(result[0].statusName).toBe('Unknown'); // Fallback: first letter capitalized
    });
  });

  describe('loadFullContractorsData', () => {
    it('should load full contractors data (relations + references)', async () => {
      const contractors = [
        { id: 1, name: 'Contractor1', manager: 1, status: 'active', type: 'client' },
      ];

      const mockTags = [{ contractor_id: 1, tag: 'tag1' }];
      const mockManagers = [{ id: 1, name: 'Manager1' }];
      const mockStatuses = [{ id: 'active', name: 'Active' }];
      const mockTypes = [{ id: 'client', name: 'Client' }];

      jest.mocked(db.query).mockImplementation((sql) => {
        if (sql.includes('contractor_tags')) return Promise.resolve({ rows: mockTags });
        if (sql.includes('contractor_bank_accounts')) return Promise.resolve({ rows: [] });
        if (sql.includes('contractor_contacts')) return Promise.resolve({ rows: [] });
        if (sql.includes('users')) return Promise.resolve({ rows: mockManagers });
        if (sql.includes('contractor_status')) return Promise.resolve({ rows: mockStatuses });
        if (sql.includes('relationship_type')) return Promise.resolve({ rows: mockTypes });
        return Promise.resolve({ rows: [] });
      });

      const result = await loadFullContractorsData(contractors);

      expect(result).toHaveLength(1);
      expect(result[0].tags).toEqual(['tag1']);
      expect(result[0].manager).toBe('Manager1');
      expect(result[0].statusName).toBe('Active');
      expect(result[0].typeName).toBe('Client');
    });

    it('should handle empty input', async () => {
      const result = await loadFullContractorsData([]);
      expect(result).toEqual([]);
      expect(jest.mocked(db.query)).not.toHaveBeenCalled();
    });

    it('should handle null input', async () => {
      const result = await loadFullContractorsData(null);
      expect(result).toEqual(null);
    });

    it('should parallelize references and relations loading', async () => {
      const contractors = [
        { id: 1, name: 'Contractor1', manager: 1, status: 'active', type: 'client' },
      ];

      const mockTags = [{ contractor_id: 1, tag: 'tag1' }];
      const mockManagers = [{ id: 1, name: 'Manager1' }];
      const mockStatuses = [{ id: 'active', name: 'Active' }];
      const mockTypes = [{ id: 'client', name: 'Client' }];

      jest.mocked(db.query)
        .mockResolvedValueOnce({ rows: mockTags })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: mockManagers })
        .mockResolvedValueOnce({ rows: mockStatuses })
        .mockResolvedValueOnce({ rows: mockTypes });

      const startTime = Date.now();
      await loadFullContractorsData(contractors);
      const duration = Date.now() - startTime;

      // Should complete quickly (parallel, not sequential)
      expect(duration).toBeLessThan(500); // Should be fast with mocks
    });
  });
});
