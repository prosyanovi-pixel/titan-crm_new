const db = require('../../../db');
const { getDefaultsSettings, updateDefaultsSettings } = require('../services/financeSettingsDefaults');
const { transformDefaultsSettings } = require('../services/financeSettingsTransforms');

jest.mock('../../../db', () => ({
  query: jest.fn(),
}));

jest.mock('../services/financeSettingsTransforms', () => ({
  transformDefaultsSettings: jest.fn(),
}));

describe('Finance Settings Defaults', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getDefaultsSettings', () => {
    it('should return null if no settings found', async () => {
      db.query.mockResolvedValueOnce({ rows: [] });
      const result = await getDefaultsSettings();
      expect(result).toBeNull();
    });

    it('should return transformed settings', async () => {
      const mockRow = { id: 1, default_currency: 'RUB' };
      db.query.mockResolvedValueOnce({ rows: [mockRow] });
      transformDefaultsSettings.mockReturnValueOnce({ defaultCurrency: 'RUB' });
      
      const result = await getDefaultsSettings();
      
      expect(transformDefaultsSettings).toHaveBeenCalledWith(mockRow);
      expect(result).toEqual({ defaultCurrency: 'RUB' });
    });
  });

  describe('updateDefaultsSettings', () => {
    it('should insert if settings do not exist', async () => {
      // First getDefaultsSettings returns null
      db.query.mockResolvedValueOnce({ rows: [] });
      
      // Then insert returns new row
      const mockRow = { id: 1, default_currency: 'USD' };
      db.query.mockResolvedValueOnce({ rows: [mockRow] });
      transformDefaultsSettings.mockReturnValueOnce({ defaultCurrency: 'USD' });
      
      const result = await updateDefaultsSettings({ defaultCurrency: 'USD' });
      
      expect(db.query).toHaveBeenCalledTimes(2);
      expect(db.query).toHaveBeenNthCalledWith(2, expect.stringContaining('INSERT INTO finance_defaults_settings'), expect.any(Array));
      expect(result).toEqual({ defaultCurrency: 'USD' });
    });

    it('should update if settings exist', async () => {
      // First getDefaultsSettings returns existing
      const existingRow = { id: 1, default_currency: 'RUB' };
      db.query.mockResolvedValueOnce({ rows: [existingRow] });
      transformDefaultsSettings.mockReturnValueOnce({ defaultCurrency: 'RUB' }); // for getDefaultsSettings
      
      // Then update returns new row
      const mockRow = { id: 1, default_currency: 'EUR' };
      db.query.mockResolvedValueOnce({ rows: [mockRow] });
      transformDefaultsSettings.mockReturnValueOnce({ defaultCurrency: 'EUR' }); // for update
      
      const result = await updateDefaultsSettings({ defaultCurrency: 'EUR' });
      
      expect(db.query).toHaveBeenCalledTimes(2);
      expect(db.query).toHaveBeenNthCalledWith(2, expect.stringContaining('UPDATE finance_defaults_settings'), expect.any(Array));
      expect(result).toEqual({ defaultCurrency: 'EUR' });
    });

    it('should throw if no fields to update', async () => {
      const existingRow = { id: 1 };
      db.query.mockResolvedValueOnce({ rows: [existingRow] });
      transformDefaultsSettings.mockReturnValueOnce({}); 
      
      await expect(updateDefaultsSettings({})).rejects.toThrow('No fields to update');
    });
  });
});
