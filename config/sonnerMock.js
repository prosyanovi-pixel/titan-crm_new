/**
 * Jest stub for the 'sonner' package.
 * Provides no-op jest.fn() implementations so tests that import 'sonner'
 * don't fail on module resolution when running under Jest.
 */
const toast = {
  info: jest.fn(),
  success: jest.fn(),
  error: jest.fn(),
  warning: jest.fn(),
  message: jest.fn(),
  loading: jest.fn(),
  dismiss: jest.fn(),
  custom: jest.fn(),
  promise: jest.fn(),
};

module.exports = { toast, Toaster: () => null };
