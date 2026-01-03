/**
 * Suite de Tests CRITICAL - Tests essentiels pour validation PR
 * 
 * Objectif: Valider toutes les fonctionnalités critiques
 * Durée: ~15 minutes
 * Navigateurs: Chromium + Firefox
 * 
 * Tests inclus:
 * - Tous les tests smoke
 * - dashboard-complete.spec.ts (interface principale)
 * - tags-folders.spec.ts (organisation)
 * - ultra-simple-form.spec.ts (formulaires IA)
 */

import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  testMatch: [
    // Smoke tests
    'production-smoke.spec.ts',
    'ultra-simple-poll.spec.ts', 
    'ultra-simple-dispo.spec.ts',
    'ultra-simple-quizz.spec.ts',
    'ultra-simple-form.spec.ts', // Activer ce test!
    
    // Tests critiques
    'dashboard-complete.spec.ts',
    'tags-folders.spec.ts',
    
    // Tests de navigation produits
    'products/date-polls/date-polls-simple.spec.ts',
    'products/form-polls/navigation.spec.ts',
    'products/availability-polls/navigation.spec.ts',
    'products/quizz/navigation.spec.ts'
  ],
  testIgnore: ['**/OLD/**'],
  
  // Configuration équilibrée
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,
  
  timeout: 45000, // 45s pour les tests critiques
  expect: {
    timeout: 15000
  },
  
  reporter: [
    ['html', { outputFolder: 'playwright-report-critical' }],
    ['json', { outputFile: 'test-results-critical.json' }],
    ['list']
  ],
  
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:4173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 12000,
    navigationTimeout: 15000,
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
  ],
});
