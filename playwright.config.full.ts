/**
 * Suite de Tests FULL - Tous les tests E2E
 * 
 * Objectif: Validation complète avant déploiement
 * Durée: ~45 minutes
 * Navigateurs: Chromium + Firefox + Webkit + Mobile
 * 
 * Tests inclus:
 * - Tous les tests critical
 * - Tests authentification
 * - Tests avancés
 * - Tests mobile
 * - Tests cross-produits
 */

import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  testMatch: [
    // Tous les tests .spec.ts sauf OLD
    '**/*.spec.ts'
  ],
  testIgnore: [
    '**/OLD/**',
    '**/temporal-prompts-validation.test.ts'
  ],
  
  // Configuration complète
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 3 : undefined,
  
  timeout: 60000, // 60s pour les tests complets
  expect: {
    timeout: 20000
  },
  
  reporter: [
    ['html', { outputFolder: 'playwright-report-full' }],
    ['json', { outputFile: 'test-results-full.json' }],
    ['junit', { outputFile: 'test-results-full-junit.xml' }],
    ['list']
  ],
  
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:4173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 15000,
    navigationTimeout: 20000,
  },

  projects: [
    // Desktop browsers
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
    
    // Mobile browsers
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
  ],
});
