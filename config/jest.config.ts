module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  rootDir: '..',
  cacheDirectory: '/tmp/jest-titan-crm',
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/e2e/', // Ignore Playwright E2E tests
    '/backend/tests/', // Ignore backend tests (they use node:test)
    '/backend/archive/', // Ignore archived/stale backend tests
    '/src/__tests__/', // Ignore stale root-level App test
    // Vitest-format tests (use vi.mock with relative hoisting) — run via `vitest` in frontend/
    '/src/api/__tests__/',
    '/src/modules/projects/components/tabs/__tests__/',
    '/src/modules/projects/hooks/__tests__/useProjectCRUD',
    '/src/modules/contractors/components/tabs/__tests__/',
    '/src/modules/documents/hooks/__tests__/',
    '/src/modules/finance/',
    // Vitest-only contractor hook tests (use vi.hoisted / vi.mock('sonner'))
    '/src/modules/contractors/hooks/__tests__/useContractorActions',
    '/src/modules/contractors/hooks/__tests__/useContractorOverview',
    // Vitest-only contracts tests (use vi.mock with relative paths)
    '/src/modules/contracts/__tests__/ContractsPage.bulk',
    '/src/modules/contracts/hooks/__tests__/useContracts.test.tsx',
  ],
  setupFilesAfterEnv: ['<rootDir>/config/setupTests.ts'],
  transform: {
    '^.+\\.(ts|tsx)$': [
      'ts-jest',
      {
        tsconfig: '<rootDir>/frontend/tsconfig.jest.json',
        diagnostics: {
          ignoreCodes: ['TS1343', 'TS2769', 'TS2307', 'TS2339'],
        },
      },
    ],
    '^.+\\.(js|jsx)$': 'babel-jest',
  },
  transformIgnorePatterns: [
    '/node_modules/(?!(@testing-library|@radix-ui|@hookform|@tanstack|@internationalized|react-dnd|dnd-core|@dnd-kit|@floating-ui|@headlessui|@heroicons|@remix-run|@stitches|@vanilla-extract|axios|date-fns|uuid|nanoid|react-markdown|remark|rehype|unified|unist|vfile|property-information|hast-util-parse-selector|space-separated-tokens|comma-separated-tokens|zwitch|ccount|escape-string-regexp|markdown-table|longest-streak|parse-entities|stringify-entities|character-entities|character-entities-legacy|character-reference-invalid|is-alphabetical|is-alphanumerical|is-decimal|is-hexadecimal|is-whitespace-character|trim-trailing-lines|)/)',
  ],
  moduleNameMapper: {
    '^vitest$': '<rootDir>/config/vitestMock.js',
    '^sonner$': '<rootDir>/config/sonnerMock.js',
    '^@/lib/api$': '<rootDir>/config/apiMock.js',
    '^@/(.*)$': '<rootDir>/frontend/src/$1',
    '\\.(css|less|sass|scss)$': 'identity-obj-proxy',
    '\\.(gif|ttf|eot|svg|png)$': '<rootDir>/config/fileMock.js',
  },
  globals: {
    'ts-jest': {
      tsconfig: '<rootDir>/frontend/tsconfig.jest.json',
      diagnostics: {
        ignoreCodes: ['TS1343', 'TS2769', 'TS2307', 'TS2339'],
      },
    },
  },
  testMatch: [
    '**/__tests__/**/*.[jt]s?(x)',
    '**/?(*.)+(spec|test).[jt]s?(x)',
  ],
};