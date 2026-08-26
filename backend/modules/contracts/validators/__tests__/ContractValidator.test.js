const ContractValidator = require('../ContractValidator');
const { AppError } = require('../../../../utils/errorHandler');

describe('ContractValidator', () => {
  test('should validate valid data', () => {
    const data = {
      name: 'Test Contract',
      amount: 1000,
      currency: 'RUB',
      status: 'draft',
      startDate: '2026-01-01',
      endDate: '2026-12-31'
    };
    expect(() => ContractValidator.validate(data)).not.toThrow();
  });

  test('should throw error if name is too short', () => {
    const data = { name: 'A' };
    expect(() => ContractValidator.validate(data)).toThrow(AppError);
    expect(() => ContractValidator.validate(data)).toThrow('Contract name must be at least 2 characters long');
  });

  test('should throw error if name is too long', () => {
    const data = { name: 'a'.repeat(501) };
    expect(() => ContractValidator.validate(data)).toThrow(AppError);
    expect(() => ContractValidator.validate(data)).toThrow('Contract name must not exceed 500 characters');
  });

  test('should throw error if amount is negative', () => {
    const data = { amount: -100 };
    expect(() => ContractValidator.validate(data)).toThrow(AppError);
    expect(() => ContractValidator.validate(data)).toThrow('Contract amount must be a non-negative number');
  });

  test('should throw error if endDate is before startDate', () => {
    const data = {
      startDate: '2026-12-31',
      endDate: '2026-01-01'
    };
    expect(() => ContractValidator.validate(data)).toThrow(AppError);
    expect(() => ContractValidator.validate(data)).toThrow('End date must be after start date');
  });

  test('should throw error for invalid currency', () => {
    const data = { currency: 'ruble' };
    expect(() => ContractValidator.validate(data)).toThrow(AppError);
    expect(() => ContractValidator.validate(data)).toThrow('Currency must be a 3-letter ISO code');
  });

  test('should throw error for invalid status', () => {
    const data = { status: 'invalid_status' };
    expect(() => ContractValidator.validate(data)).toThrow(AppError);
    expect(() => ContractValidator.validate(data)).toThrow('Invalid contract status');
  });
});
