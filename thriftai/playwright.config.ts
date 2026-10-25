import { defineConfig, devices } from '@playwright/test'

/**
 * Smoke tests for the main flows (frontend plan F6).
 *   npm run test:e2e                         # against http://localhost:3000 (starts `npm run dev` if nothing is running)
 *   E2E_BASE_URL=https://… npm run test:e2e  # against another deployment
 * Uses the system Chrome. Tests never call the Claude API and clean up any rows they create.
 */
const baseURL = process.env.E2E_BASE_URL ?? 'http://localhost:3000'

export default defineConfig({
  testDir: 'tests/e2e',
  globalSetup: './tests/e2e/global-setup.ts',
  globalTeardown: './tests/e2e/global-teardown.ts',
  timeout: 60_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list']],
  use: { baseURL, channel: 'chrome', trace: 'retain-on-failure' },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], channel: 'chrome' } },
    { name: 'mobile', use: { ...devices['Pixel 7'], channel: 'chrome' }, testMatch: /public\.spec\.ts/ },
  ],
  webServer: process.env.E2E_BASE_URL ? undefined : { command: 'npm run dev', url: baseURL, reuseExistingServer: true, timeout: 120_000 },
})
