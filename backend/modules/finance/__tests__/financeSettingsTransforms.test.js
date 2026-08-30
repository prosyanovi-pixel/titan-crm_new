const {
  parseDate,
  transformTaxRegime,
  transformTaxRate,
  transformAllocationMethod,
  transformOverheadArticle,
  transformDefaultsSettings,
} = require('../services/financeSettingsTransforms');

describe('Finance Settings Transforms', () => {
  describe('parseDate', () => {
    it('should return null for empty input', () => {
      expect(parseDate(null)).toBeNull();
      expect(parseDate('')).toBeNull();
    });

    it('should parse DD.MM.YYYY format', () => {
      const date = parseDate('31.12.2023');
      expect(date).toBeInstanceOf(Date);
      expect(date.getFullYear()).toBe(2023);
      expect(date.getMonth()).toBe(11); // 0-indexed
      expect(date.getDate()).toBe(31);
    });

    it('should parse standard ISO format', () => {
      const date = parseDate('2023-12-31T00:00:00Z');
      expect(date).toBeInstanceOf(Date);
      expect(date.getFullYear()).toBe(2023);
    });
  });

  describe('transformTaxRegime', () => {
    it('should handle null/undefined', () => {
      expect(transformTaxRegime(null)).toBeNull();
    });

    it('should transform snake_case to camelCase and apply defaults', () => {
      const input = {
        id: 1,
        is_active: true,
        has_vat: false,
        default_vat_rate: '20.5',
        applies_to_legal_forms: ['ooo'],
      };

      const result = transformTaxRegime(input);
      expect(result.isActive).toBe(true);
      expect(result.hasVat).toBe(false);
      expect(result.defaultVatRate).toBe(20.5);
      expect(result.appliesToLegalForms).toEqual(['ooo']);
      expect(result.validFrom).toBe('2024-01-01'); // default fallback
    });
  });

  describe('transformTaxRate', () => {
    it('should handle null', () => {
      expect(transformTaxRate(null)).toBeNull();
    });

    it('should transform snake_case and parse floats', () => {
      const input = {
        tax_type: 'vat',
        fixed_amount: '100',
        rate: '20',
        is_default: true,
      };

      const result = transformTaxRate(input);
      expect(result.taxType).toBe('vat');
      expect(result.fixedAmount).toBe(100);
      expect(result.rate).toBe(20);
      expect(result.isDefault).toBe(true);
      expect(result.legalForms).toEqual([]);
    });
  });

  describe('transformAllocationMethod', () => {
    it('should transform fields', () => {
      const input = { allocation_base: 'revenue', is_active: true };
      const result = transformAllocationMethod(input);
      expect(result.allocationBase).toBe('revenue');
      expect(result.isActive).toBe(true);
    });
  });

  describe('transformOverheadArticle', () => {
    it('should transform fields', () => {
      const input = { parent_id: 2, article_type: 'rent' };
      const result = transformOverheadArticle(input);
      expect(result.parentId).toBe(2);
      expect(result.articleType).toBe('rent');
    });
  });

  describe('transformDefaultsSettings', () => {
    it('should transform fields', () => {
      const input = { default_tax_regime_id: 1, auto_calculate_vat: true, min_profitability_threshold: '15.5' };
      const result = transformDefaultsSettings(input);
      expect(result.defaultTaxRegimeId).toBe(1);
      expect(result.autoCalculateVat).toBe(true);
      expect(result.minProfitabilityThreshold).toBe(15.5);
    });
  });
});
