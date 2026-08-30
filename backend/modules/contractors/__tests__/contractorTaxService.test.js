const db = require('../../../db');
const financeSettingsService = require('../../finance/services/financeSettingsService');
const {
  setTaxRegime,
  getTaxInfo,
  getTaxHistory,
  checkLimits,
  getTaxOptimizationSuggestions,
} = require('../services/contractorTaxService');

jest.mock('../../../db', () => ({
  query: jest.fn(),
}));

jest.mock('../../finance/services/financeSettingsService', () => ({
  getTaxRegimeById: jest.fn(),
  getActiveTaxes: jest.fn(),
  validateRegimeForContractor: jest.fn(),
}));

describe('Contractor Tax Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getTaxInfo', () => {
    it('should return tax info for contractor', async () => {
      db.query
        .mockResolvedValueOnce({
          rows: [
            {
              id: 1,
              name: 'Test OOO',
              legalForm: 'ooo',
              taxRegimeId: 10,
              regimeCode: 'osn',
              regimeName: 'ОСН',
            },
          ],
        }) // base info
        .mockResolvedValueOnce({
          rows: [
            {
              taxRegimeId: 10,
              maxIncomeLimit: null,
              maxEmployeesLimit: null,
              requiresOnlineCashier: false,
            },
          ],
        }) // check limits
        .mockResolvedValueOnce({
          rows: [],
        }); // history

      financeSettingsService.getTaxRegimeById.mockResolvedValueOnce({ id: 10, name: 'ОСН' });
      financeSettingsService.getActiveTaxes.mockResolvedValueOnce([
        { taxType: 'nds', name: 'НДС', rate: 20 },
      ]);

      const result = await getTaxInfo(1);

      expect(result.contractorId).toBe(1);
      expect(result.taxRegime.name).toBe('ОСН');
      expect(result.activeTaxes).toHaveLength(1);
      expect(result.activeTaxes[0].name).toBe('НДС');
      expect(result.limitsCheck.passed).toBe(true);
    });

    it('should throw if contractor not found', async () => {
      db.query.mockResolvedValueOnce({ rows: [] });
      await expect(getTaxInfo(999)).rejects.toThrow('не найден');
    });
  });

  describe('setTaxRegime', () => {
    it('should set new tax regime and log history', async () => {
      db.query
        .mockResolvedValueOnce({ rows: [{ id: 1, legalForm: 'ooo' }] }) // check contractor
        .mockResolvedValueOnce({ rows: [{ taxRegimeId: 1 }] }) // get current regime
        .mockResolvedValueOnce({ rowCount: 1 }) // update
        .mockResolvedValueOnce({ rowCount: 1 }); // history insert

      financeSettingsService.getTaxRegimeById.mockResolvedValueOnce({ id: 2, name: 'УСН' });
      financeSettingsService.validateRegimeForContractor.mockResolvedValueOnce({ valid: true });

      const result = await setTaxRegime(1, 2, { reason: 'Переход', changedBy: 100 });

      expect(result.success).toBe(true);
      expect(result.oldRegimeId).toBe(1);
      expect(result.newRegimeId).toBe(2);
      expect(db.query).toHaveBeenCalledWith(expect.stringContaining('UPDATE contractors'), [2, 1]);
      expect(db.query).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO contractor_tax_history'), expect.any(Array));
    });

    it('should throw if regime is invalid for contractor', async () => {
      db.query.mockResolvedValueOnce({ rows: [{ id: 1, legalForm: 'ip' }] });
      financeSettingsService.getTaxRegimeById.mockResolvedValueOnce({ id: 99 });
      financeSettingsService.validateRegimeForContractor.mockResolvedValueOnce({
        valid: false,
        error: 'Недопустимый режим',
      });

      await expect(setTaxRegime(1, 99)).rejects.toThrow('Недопустимый режим');
    });
  });

  describe('checkLimits', () => {
    it('should return warnings if limits exceeded', async () => {
      db.query.mockResolvedValueOnce({
        rows: [
          {
            taxRegimeId: 1,
            annualIncome: 200000000, // 200 mil
            employeeCount: 150,
            hasOnlineCashier: false,
            maxIncomeLimit: 150000000,
            maxEmployeesLimit: 100,
            requiresOnlineCashier: true,
          },
        ],
      });

      const result = await checkLimits(1);

      expect(result.passed).toBe(false);
      expect(result.details.income.passed).toBe(false);
      expect(result.details.employees.passed).toBe(false);
      expect(result.details.onlineCashier.passed).toBe(false);
      expect(result.warnings.length).toBeGreaterThan(0);
    });
  });

  describe('getTaxOptimizationSuggestions', () => {
    it('should suggest USN if income is good and on OSN', async () => {
      db.query.mockResolvedValueOnce({
        rows: [
          {
            legalForm: 'ooo',
            taxRegimeId: 1,
            currentRegimeCode: 'OSN',
            annualIncome: 15000000,
            employeeCount: 10,
          },
        ],
      });

      const suggestions = await getTaxOptimizationSuggestions(1);
      
      const usnSuggestion = suggestions.find(s => s.title.includes('УСН'));
      expect(usnSuggestion).toBeDefined();
    });

    it('should warn if no tax regime set', async () => {
      db.query.mockResolvedValueOnce({
        rows: [
          {
            legalForm: 'ooo',
            taxRegimeId: null,
          },
        ],
      });

      const suggestions = await getTaxOptimizationSuggestions(1);
      
      const warning = suggestions.find(s => s.type === 'warning');
      expect(warning).toBeDefined();
      expect(warning.title).toContain('Не указан');
    });
  });
});
