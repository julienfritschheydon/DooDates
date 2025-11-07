import { defineConfig, devices } from '@playwright/test';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Charger les variables d'environnement depuis .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

export default defineConfig({
  testDir: './tests',
  testMatch: ['**/*.spec.ts', '**/*.test.ts', '**/*_test.ts'],
  testIgnore: ['**/OLD/**', '**/error-handling-enforcement.test.ts'],
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
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
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