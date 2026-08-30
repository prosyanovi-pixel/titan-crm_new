const db = require('../../../db');
const TaxRegimeValidator = require('../validators/TaxRegimeValidator');
const legalFormService = require('../../contractors/services/legalFormService');

jest.mock('../../../db', () => ({
  query: jest.fn(),
}));

jest.mock('../../contractors/services/legalFormService', () => ({
  getTaxRegimesMapping: jest.fn(),
}));

describe('TaxRegimeValidator', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('validateCreate', () => {
    it('should return errors for missing required fields', () => {
      const result = TaxRegimeValidator.validateCreate({});
      expect(result).toContain('Код режима обязателен');
      expect(result).toContain('Название режима обязательно');
    });

    it('should validate dates correctly', () => {
      const data = {
        code: 'test',
        name: 'test',
        validFrom: '2025-01-01',
        validTo: '2024-01-01',
      };
      const result = TaxRegimeValidator.validateCreate(data);
      expect(result).toContain('Дата начала действия не может быть позже даты окончания');
    });

    it('should validate rates to be between 0 and 100', () => {
      const data = {
        code: 'test',
        name: 'test',
        defaultVatRate: 150,
        defaultUsnRate: -5,
      };
      const result = TaxRegimeValidator.validateCreate(data);
      expect(result).toContain('Поле defaultVatRate должно быть в диапазоне 0-100');
      expect(result).toContain('Поле defaultUsnRate должно быть в диапазоне 0-100');
    });

    it('should return empty array for valid data', () => {
      const data = {
        code: 'test',
        name: 'test',
        appliesToLegalForms: ['ooo'],
        validFrom: '2024-01-01',
        validTo: '2025-01-01',
        defaultVatRate: 20,
      };
      const result = TaxRegimeValidator.validateCreate(data);
      expect(result).toHaveLength(0);
    });
  });

  describe('validateForLegalForm', () => {
    it('should return invalid if mapping not found', async () => {
      legalFormService.getTaxRegimesMapping.mockResolvedValueOnce(null);
      const result = await TaxRegimeValidator.validateForLegalForm(1, 'ooo');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Юридическая форма не найдена');
    });

    it('should return valid if regime is in availableRegimes', async () => {
      legalFormService.getTaxRegimesMapping.mockResolvedValueOnce({
        availableRegimes: [{ id: 1 }, { id: 2 }],
      });
      const result = await TaxRegimeValidator.validateForLegalForm(1, 'ooo');
      expect(result.valid).toBe(true);
      expect(result.error).toBeNull();
    });

    it('should return invalid if regime is not available', async () => {
      legalFormService.getTaxRegimesMapping.mockResolvedValueOnce({
        availableRegimes: [{ id: 2 }],
      });
      const result = await TaxRegimeValidator.validateForLegalForm(1, 'ooo');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Режим не доступен для данной юридической формы');
    });
  });

  describe('isCodeUnique', () => {
    it('should return true if count is 0', async () => {
      db.query.mockResolvedValueOnce({ rows: [{ count: '0' }] });
      const result = await TaxRegimeValidator.isCodeUnique('osn');
      expect(result).toBe(true);
    });

    it('should return false if count is greater than 0', async () => {
      db.query.mockResolvedValueOnce({ rows: [{ count: '1' }] });
      const result = await TaxRegimeValidator.isCodeUnique('osn');
      expect(result).toBe(false);
    });
  });

  describe('validateDeletion', () => {
    it('should return canDelete true if no dependencies', async () => {
      db.query
        .mockResolvedValueOnce({ rows: [{ count: '0' }] }) // contractors
        .mockResolvedValueOnce({ rows: [{ count: '0' }] }); // rates
      
      const result = await TaxRegimeValidator.validateDeletion(1);
      
      expect(result.canDelete).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should return canDelete false if dependencies exist', async () => {
      db.query
        .mockResolvedValueOnce({ rows: [{ count: '5' }] }) // contractors
        .mockResolvedValueOnce({ rows: [{ count: '2' }] }); // rates
      
      const result = await TaxRegimeValidator.validateDeletion(1);
      
      expect(result.canDelete).toBe(false);
      expect(result.errors).toHaveLength(2);
      expect(result.errors[0]).toContain('5 контрагентов');
      expect(result.errors[1]).toContain('2 связанных ставок');
    });
  });
});
