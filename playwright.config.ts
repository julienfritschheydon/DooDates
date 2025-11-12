import { defineConfig, devices } from '@playwright/test';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Charger les variables d'environnement depuis .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

export default defineConfig({
  testDir: './tests',
  // Match Playwright test files (.spec.ts everywhere, .test.ts in specific directories)
  // Exclude Vitest test files that import from 'vitest' to avoid expect matcher conflicts
  testMatch: [
    '**/*.spec.ts', // All .spec.ts files (Playwright convention)
    'e2e/**/*.test.ts', // .test.ts files in e2e/
    'integration/**/*.test.ts', // .test.ts files in integration/
    'debug-*.test.ts', // Debug test files in root (e.g., debug-gemini-edge.test.ts)
  ],
  testIgnore: [
    '**/OLD/**',
    // Explicitly exclude Vitest test files that would conflict with Playwright's expect
    'temporal-prompts-validation.test.ts',
  ],
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 3 : undefined,
  reporter: 'html',
  timeout: 60000,
  use: {
    baseURL: 'http://localhost:8080',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    actionTimeout: 15000,
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
      use: { 
        ...devices['Desktop Safari'],
        // Safari peut être plus lent, augmenter les timeouts
        actionTimeout: 20000,
      },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { 
        ...devices['iPhone 12'],
        // Mobile Safari est souvent plus lent, augmenter les timeouts
        actionTimeout: 25000,
      },
    },
  ],

  webServer: {
    command: 'npm run dev:e2e',
    url: 'http://localhost:8080',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
    env: {
      // Injecter les variables d'environnement de test dans le serveur de dev
      // Utiliser localhost:8080 comme URL factice pour que les mocks puissent intercepter
      VITE_SUPABASE_URL: process.env.VITE_SUPABASE_URL_TEST || process.env.VITE_SUPABASE_URL || 'http://localhost:8080',
      VITE_SUPABASE_ANON_KEY: process.env.VITE_SUPABASE_ANON_KEY_TEST || process.env.VITE_SUPABASE_ANON_KEY || 'test-anon-key',
    },
  },
});