/**
 * Jest environment setup file (runs before test framework is installed).
 * Polyfills import.meta.env for Vite-specific code running under Jest/Node.
 */

// Provide import.meta shim so Vite-style source files can be loaded under Jest
Object.defineProperty(globalThis, 'importMeta', {
  value: { env: { VITE_API_URL: '/api' } },
  writable: true,
  configurable: true,
});

// Jest does not support import.meta natively with CommonJS transform.
// ts-jest with diagnostics.ignoreCodes suppresses the TS error;
// at runtime, babel-jest / ts-jest replaces import.meta.env references
// through the moduleNameMapper below, so no runtime shim is needed here.
