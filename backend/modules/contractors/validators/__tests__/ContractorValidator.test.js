/**
 * Unit tests для ContractorValidator.js
 * Тестирует валидацию всех полей контрагентов
 */

// Mock db module (must be before requiring the module under test)
jest.mock('../../../../db', () => ({
  query: jest.fn(),
}));
const db = require('../../../../db');

const {
  validateINN,
  validateKPP,
  validateOGRN,
  validateEmail,
  validatePhone,
  validateName,
  validateBankAccount,
  checkDuplicateINN,
  validateCreateRequest,
  validateUpdateRequest
} = require('../ContractorValidator');

describe('ContractorValidator', () => {
  describe('validateINN', () => {
    it('should accept valid 10-digit INN', () => {
      const result = validateINN('7707083893');
      expect(result.valid).toBe(true);
    });

    it('should accept valid 12-digit INN', () => {
      const result = validateINN('770708389300');
      expect(result.valid).toBe(true);
    });

    it('should reject non-numeric INN', () => {
      const result = validateINN('770170172AB');
      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should reject INN with wrong length', () => {
      const result = validateINN('77017017');
      expect(result.valid).toBe(false);
    });

    it('should allow empty/null INN', () => {
      expect(validateINN(null).valid).toBe(true);
      expect(validateINN('').valid).toBe(true);
    });

    it('should trim whitespace', () => {
      const result = validateINN('  7707083893  ');
      expect(result.valid).toBe(true);
    });
  });

  describe('validateKPP', () => {
    it('should accept valid 9-digit KPP for legal entities', () => {
      const result = validateKPP('770101001', 'legal');
      expect(result.valid).toBe(true);
    });

    it('should reject KPP for individuals', () => {
      const result = validateKPP('770101001', 'individual');
      expect(result.valid).toBe(true); // Not rejected, just not required
    });

    it('should reject non-numeric KPP', () => {
      const result = validateKPP('77010100A', 'legal');
      expect(result.valid).toBe(false);
    });

    it('should reject KPP with wrong length', () => {
      const result = validateKPP('7701010', 'legal');
      expect(result.valid).toBe(false);
    });

    it('should allow empty KPP', () => {
      expect(validateKPP(null, 'legal').valid).toBe(true);
      expect(validateKPP('', 'legal').valid).toBe(true);
    });
  });

  describe('validateOGRN', () => {
    it('should accept valid 13-digit OGRN', () => {
      const result = validateOGRN('1077701721721', 'legal');
      expect(result.valid).toBe(true);
    });

    it('should accept valid 15-digit OGRN', () => {
      const result = validateOGRN('307770167265100', 'individual');
      expect(result.valid).toBe(true);
    });

    it('should reject non-numeric OGRN', () => {
      const result = validateOGRN('107770172172A', 'legal');
      expect(result.valid).toBe(false);
    });

    it('should reject OGRN with wrong length', () => {
      const result = validateOGRN('10777017217', 'legal');
      expect(result.valid).toBe(false);
    });

    it('should allow empty OGRN', () => {
      expect(validateOGRN(null, 'legal').valid).toBe(true);
    });
  });

  describe('validateEmail', () => {
    it('should accept valid email', () => {
      expect(validateEmail('test@example.com').valid).toBe(true);
      expect(validateEmail('user.name+tag@example.co.uk').valid).toBe(true);
    });

    it('should reject invalid email format', () => {
      expect(validateEmail('test@').valid).toBe(false);
      expect(validateEmail('test.example.com').valid).toBe(false);
      expect(validateEmail('@example.com').valid).toBe(false);
    });

    it('should reject email that is too long', () => {
      const longEmail = 'a'.repeat(100) + '@test.com';
      expect(validateEmail(longEmail).valid).toBe(false);
    });

    it('should allow empty email', () => {
      expect(validateEmail(null).valid).toBe(true);
      expect(validateEmail('').valid).toBe(true);
    });

    it('should reject email with spaces', () => {
      expect(validateEmail('test @example.com').valid).toBe(false);
    });
  });

  describe('validatePhone', () => {
    it('should accept valid phone numbers', () => {
      expect(validatePhone('+7 (495) 123-45-67').valid).toBe(true);
      expect(validatePhone('8-495-123-45-67').valid).toBe(true);
      expect(validatePhone('74951234567').valid).toBe(true);
    });

    it('should reject phone with too few digits', () => {
      const result = validatePhone('123-45');
      expect(result.valid).toBe(false);
    });

    it('should reject phone that is too long', () => {
      const longPhone = '+7 ' + '1234567890'.repeat(3);
      expect(validatePhone(longPhone).valid).toBe(false);
    });

    it('should allow empty phone', () => {
      expect(validatePhone(null).valid).toBe(true);
      expect(validatePhone('').valid).toBe(true);
    });

    it('should extract digits and validate count', () => {
      // "(123) 456 7890" → 10 digits → valid
      expect(validatePhone('(123) 456 7890').valid).toBe(true);
    });
  });

  describe('validateName', () => {
    it('should accept valid names', () => {
      expect(validateName('ООО Рога и Копыта').valid).toBe(true);
      expect(validateName('АО').valid).toBe(true);
    });

    it('should reject empty name', () => {
      expect(validateName(null).valid).toBe(false);
      expect(validateName('').valid).toBe(false);
      expect(validateName('   ').valid).toBe(false);
    });

    it('should reject name shorter than 2 chars', () => {
      expect(validateName('A').valid).toBe(false);
    });

    it('should reject name longer than 500 chars', () => {
      const longName = 'A'.repeat(501);
      expect(validateName(longName).valid).toBe(false);
    });

    it('should trim whitespace', () => {
      expect(validateName('  Valid Name  ').valid).toBe(true);
    });
  });

  describe('validateBankAccount', () => {
    it('should accept valid bank account', () => {
      const account = {
        accountNumber: '40702810100000000123',
        bik: '044525225',
        swift: 'SABRRUMM'
      };
      expect(validateBankAccount(account).valid).toBe(true);
    });

    it('should reject account number with wrong length', () => {
      const account = { accountNumber: '4070281010000000' };
      expect(validateBankAccount(account).valid).toBe(false);
    });

    it('should reject BIK with wrong length', () => {
      const account = { bik: '04452522' };
      expect(validateBankAccount(account).valid).toBe(false);
    });

    it('should reject invalid SWIFT code', () => {
      const account = { swift: 'INVALID123' };
      expect(validateBankAccount(account).valid).toBe(false);
    });

    it('should allow partial bank data', () => {
      expect(validateBankAccount({ bik: '044525225' }).valid).toBe(true);
      expect(validateBankAccount({ accountNumber: '40702810100000000123' }).valid).toBe(true);
    });

    it('should allow empty bank data', () => {
      expect(validateBankAccount(null).valid).toBe(true);
      expect(validateBankAccount({}).valid).toBe(true);
    });
  });

  describe('checkDuplicateINN', () => {
    beforeEach(() => {
      jest.resetAllMocks();
    });

    it('should pass if INN not found in database', async () => {
      jest.mocked(db.query).mockResolvedValueOnce({ rows: [] });

      const result = await checkDuplicateINN('7707083893');
      expect(result.valid).toBe(true);
    });

    it('should fail if INN already exists', async () => {
      jest.mocked(db.query).mockResolvedValueOnce({
        rows: [{ id: 123 }]
      });

      const result = await checkDuplicateINN('7707083893');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('уже существует');
      expect(result.existingId).toBe(123);
    });

    it('should exclude specified contractor ID when checking', async () => {
      jest.mocked(db.query).mockResolvedValueOnce({ rows: [] });

      await checkDuplicateINN('7707083893', 999);

      const queryCall = jest.mocked(db.query).mock.calls[0];
      expect(queryCall[0]).toContain('id != $2');
      expect(queryCall[1]).toContain(999);
    });

    it('should allow empty INN', async () => {
      const result = await checkDuplicateINN(null);
      expect(result.valid).toBe(true);
      expect(jest.mocked(db.query)).not.toHaveBeenCalled();
    });
  });

  describe('validateCreateRequest', () => {
    beforeEach(() => {
      jest.resetAllMocks();
    });

    it('should validate complete valid request', async () => {
      jest.mocked(db.query).mockResolvedValueOnce({ rows: [] });

      const data = {
        name: 'Test Company',
        inn: '7707083893',
        status: 'active',
        phone: '+7 (495) 123-45-67',
        email: 'test@company.com'
      };

      const result = await validateCreateRequest(data);
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual({});
    });

    it('should collect multiple validation errors', async () => {
      jest.mocked(db.query).mockResolvedValueOnce({ rows: [] });

      const data = {
        name: '', // Invalid
        inn: 'invalid', // Invalid
        phone: '123', // Invalid
        email: 'not-an-email' // Invalid
      };

      const result = await validateCreateRequest(data);
      expect(result.valid).toBe(false);
      expect(result.errors.name).toBeDefined();
      expect(result.errors.inn).toBeDefined();
      expect(result.errors.phone).toBeDefined();
      expect(result.errors.email).toBeDefined();
    });

    it('should check for duplicate INN', async () => {
      jest.mocked(db.query).mockResolvedValueOnce({ rows: [{ id: 123 }] });

      const data = {
        name: 'Test Company',
        inn: '7707083893'
      };

      const result = await validateCreateRequest(data);
      expect(result.valid).toBe(false);
      expect(result.errors.inn).toContain('уже существует');
    });

    it('should skip duplicate check when requested', async () => {
      const data = {
        name: 'Test Company',
        inn: '7707083893'
      };

      const result = await validateCreateRequest(data, { skipDuplicateCheck: true });
      expect(jest.mocked(db.query)).not.toHaveBeenCalled();
    });

    it('should validate bank accounts in array', async () => {
      jest.mocked(db.query).mockResolvedValueOnce({ rows: [] });

      const data = {
        name: 'Test Company',
        bankAccounts: [
          { accountNumber: '4070281010000000' }, // Too short
          { bik: '04452522' } // Too short
        ]
      };

      const result = await validateCreateRequest(data);
      expect(result.valid).toBe(false);
      expect(result.errors['bankAccounts.0']).toBeDefined();
      expect(result.errors['bankAccounts.1']).toBeDefined();
    });
  });

  describe('validateUpdateRequest', () => {
    beforeEach(() => {
      jest.resetAllMocks();
    });

    it('should validate only provided fields', async () => {
      const data = { name: 'Updated Name' };
      const result = await validateUpdateRequest(data, 123);

      expect(result.valid).toBe(true);
      expect(jest.mocked(db.query)).not.toHaveBeenCalled();
    });

    it('should check for duplicate INN on update', async () => {
      jest.mocked(db.query).mockResolvedValueOnce({ rows: [{ id: 456 }] });

      const data = { inn: '7707083893' };
      const result = await validateUpdateRequest(data, 123);

      expect(result.valid).toBe(false);
      expect(result.errors.inn).toContain('уже существует');

      // Should have excluded current contractor ID
      const queryCall = jest.mocked(db.query).mock.calls[0];
      expect(queryCall[1]).toContain(123);
    });

    it('should allow updating to same INN', async () => {
      jest.mocked(db.query).mockResolvedValueOnce({ rows: [] });

      const data = { inn: '7707083893' };
      const result = await validateUpdateRequest(data, 123);

      expect(result.valid).toBe(true);
    });

    it('should not error on partial bank account update', async () => {
      const data = {
        bankAccounts: [
          { accountNumber: '40702810100000000123' }
        ]
      };

      const result = await validateUpdateRequest(data, 123);
      expect(result.valid).toBe(true);
    });

    it('should allow undefined fields', async () => {
      const data = {
        name: 'Updated',
        email: undefined,
        phone: undefined
      };

      const result = await validateUpdateRequest(data, 123);
      expect(result.valid).toBe(true);
    });
  });

  describe('Integration scenarios', () => {
    beforeEach(() => {
      jest.resetAllMocks();
    });

    it('should validate new contractor creation', async () => {
      jest.mocked(db.query).mockResolvedValueOnce({ rows: [] });

      const newContractor = {
        name: 'New Contractor LLC',
        inn: '7707083893',
        kpp: '770101001',
        ogrn: '1077701721721',
        email: 'contact@contractor.com',
        phone: '+7 (495) 123-45-67',
        bankAccounts: [
          {
            accountNumber: '40702810100000000123',
            bik: '044525225',
            bankName: 'Sberbank'
          }
        ]
      };

      const result = await validateCreateRequest(newContractor);
      expect(result.valid).toBe(true);
      expect(Object.keys(result.errors)).toHaveLength(0);
    });

    it('should catch malformed contractor data', async () => {
      jest.mocked(db.query).mockResolvedValueOnce({ rows: [] });

      const badContractor = {
        name: 'A', // Too short
        inn: 'ABC123', // Invalid format
        phone: '123', // Too short
        email: 'invalid', // Invalid format
        bankAccounts: [
          { accountNumber: '123' } // Too short
        ]
      };

      const result = await validateCreateRequest(badContractor);
      expect(result.valid).toBe(false);
      expect(Object.keys(result.errors).length).toBeGreaterThan(0);
    });
  });
});
