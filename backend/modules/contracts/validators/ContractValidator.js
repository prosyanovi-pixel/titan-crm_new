/**
 * Contract Validator
 */

const { AppError } = require('../../../utils/errorHandler');

class ContractValidator {
  /**
   * Validate contract data for create or update
   */
  static validate(data) {
    const { name, amount, startDate, endDate, currency, status } = data;

    // name — обязательный, длина 2–500 символов
    if (name !== undefined) {
      if (!name || name.trim().length < 2) {
        throw new AppError('Contract name must be at least 2 characters long', 400);
      }
      if (name.length > 500) {
        throw new AppError('Contract name must not exceed 500 characters', 400);
      }
    }

    // amount — число ≥ 0, если указано
    if (amount !== undefined && amount !== null && amount !== '') {
      const numAmount = parseFloat(amount);
      if (isNaN(numAmount) || numAmount < 0) {
        throw new AppError('Contract amount must be a non-negative number', 400);
      }
    }

    // endDate > startDate (если оба присутствуют)
    if (startDate && endDate) {
      if (new Date(endDate) <= new Date(startDate)) {
        throw new AppError('End date must be after start date', 400);
      }
    }

    // currency — ISO 4217 (3 буквы uppercase)
    if (currency !== undefined && currency !== null) {
      if (!/^[A-Z]{3}$/.test(currency)) {
        throw new AppError('Currency must be a 3-letter ISO code (e.g., RUB, USD)', 400);
      }
    }

    // status — только из допустимых значений enum
    const validStatuses = ['draft', 'pending_approval', 'approved', 'rejected', 'archived', 'active', 'terminated', 'completed', 'cancelled'];
    if (status !== undefined && status !== null) {
      if (!validStatuses.includes(status)) {
        throw new AppError(`Invalid contract status: ${status}`, 400);
      }
    }

    return true;
  }
}

module.exports = ContractValidator;
