/**
 * Jest mock for @/lib/api
 * Replaces the Vite-specific api.ts (which uses import.meta.env) with
 * jest.fn() stubs so tests can run without a real backend.
 */

const api = {
  get: jest.fn().mockResolvedValue([]),
  post: jest.fn().mockResolvedValue({}),
  put: jest.fn().mockResolvedValue({}),
  patch: jest.fn().mockResolvedValue({}),
  delete: jest.fn().mockResolvedValue({}),
  upload: jest.fn().mockResolvedValue({}),
};

module.exports = { api };
