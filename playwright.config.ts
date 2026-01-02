import { defineConfig, devices } from '@playwright/test';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as os from 'os';

// Charger les variables d'environnement depuis .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

// Configuration avec port dynamique
const port = parseInt(process.env.PORT || '8080', 10);
const baseURL = `http://localhost:${port}`;

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
  reporter: [
    ['html'],
    ['json', { outputFile: 'test-results/results.json' }],
    ['junit', { outputFile: 'test-results/junit.xml' }],
    ['line'],
    ['list'],
  ],
  timeout: 60000,
  use: {
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    actionTimeout: 15000,
    // Sortie des traces et screenshots dans test-results/
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
    command: process.env.PORT ? `npm run dev:e2e -- --port ${port}` : 'npm run dev:e2e',
    port: port,
    reuseExistingServer: !(process.env.CI || process.env.GITHUB_ACTIONS),
    timeout: 60 * 1000, // Pas plus de 1 minute, sinon ce n'est pas normal
    stdout: 'pipe',
    stderr: 'pipe',
    env: {
      NODE_ENV: 'test', // Forcer le mode test
      VITE_SUPABASE_URL: process.env.VITE_SUPABASE_URL_TEST || process.env.VITE_SUPABASE_URL || 'http://localhost:8080',
      VITE_SUPABASE_ANON_KEY: process.env.VITE_SUPABASE_ANON_KEY_TEST || process.env.VITE_SUPABASE_ANON_KEY || 'test-anon-key',
      // Désactiver HMR pour les tests
      VITE_HMR: 'false',
      // Désactiver les optimisations en développement pour accélérer le démarrage
      VITE_DEV_SERVER_OPTIMIZE_DEPS: 'false',
    },
  },
});
