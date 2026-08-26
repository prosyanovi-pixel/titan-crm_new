import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: '../e2e',
  testMatch: ['**/e2e/**/*.{test,spec}.{js,ts,tsx}'],
  testIgnore: [
    '**/node_modules/**',
    '**/backend/**',
    '**/src/**',
    '**/tests/**',
    '**/__tests__/**',
  ],
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html'],
    ['list', { printSteps: true }],
    ...(process.env.CI ? [['github'] as const] : []),
  ],
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3001',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],
  webServer: {
    command: 'npm run dev --prefix ../frontend',
    url: 'http://localhost:3001',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});