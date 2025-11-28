import { defineConfig, devices } from '@playwright/test';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as os from 'os';

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
    // Tests de tracking des crédits - maintenant migrés et prêts pour tests
    // '**/quota-tracking-complete.spec.ts', // Retiré de l'exclusion après migration
  ],
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  // Utiliser plus de workers pour accélérer l'exécution (75% des CPU disponibles en local, 3 en CI)
  workers: process.env.CI ? 3 : Math.floor(os.cpus().length * 0.75),
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

  // Désactiver webServer pour utiliser le serveur déjà démarré manuellement
  webServer: undefined,
});
