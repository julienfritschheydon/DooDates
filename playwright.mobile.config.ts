import { defineConfig, devices } from '@playwright/test';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Charger les variables d'environnement depuis .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

export default defineConfig({
  testDir: './tests',
  testMatch: ['**/mobile-debug.spec.ts'],
  timeout: 120 * 1000, // Augmenté à 2 minutes pour le débogage
  expect: { timeout: 10000 },
  fullyParallel: false, // Désactivé pour faciliter le débogage
  forbidOnly: false, // Permet les tests only pendant le débogage
  retries: 0, // Pas de réessai pour faciliter le débogage
  workers: 1, // Un seul worker pour le débogage
  reporter: [
    ['html', { open: 'on-failure' }],
    ['list'],
    ['json', { outputFile: 'test-results/mobile-debug-results.json' }]
  ],
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on', // Toujours activer les traces
    screenshot: 'on', // Toujours prendre des captures d'écran
    video: 'on', // Toujours enregistrer les vidéos
    actionTimeout: 30000, // Augmenté pour les tests tactiles
    navigationTimeout: 30000,
    viewport: { width: 393, height: 851 }, // Taille du Pixel 5
    deviceScaleFactor: 2.75,
    isMobile: true,
    hasTouch: true,
    launchOptions: {
      slowMo: 100, // Ralentir les actions pour le débogage
      headless: false, // Toujours afficher le navigateur
      devtools: true, // Ouvrir les outils de développement
      args: [
        '--use-fake-ui-for-media-stream',
        '--use-fake-device-for-media-stream',
        '--window-size=393,851',
        '--window-position=0,0',
        '--disable-dev-shm-usage',
        '--no-sandbox',
        '--disable-setuid-sandbox'
      ]
    },
    contextOptions: {
      ignoreHTTPSErrors: true,
      recordVideo: { 
        dir: 'test-results/videos/',
        size: { width: 393, height: 851 }
      },
      permissions: ['clipboard-read', 'clipboard-write']
    }
  },

  projects: [
    {
      name: 'mobile-chrome',
      use: { 
        ...devices['Pixel 5'],
        browserName: 'chromium',
        // Surcharge des options pour Chrome mobile
        launchOptions: {
          args: [
            '--use-fake-ui-for-media-stream',
            '--use-fake-device-for-media-stream',
            '--window-size=393,851',
            '--window-position=0,0'
          ]
        }
      },
    },
    {
      name: 'mobile-safari',
      use: { 
        ...devices['iPhone 12'],
        browserName: 'webkit',
        // Options spécifiques pour Safari mobile
        launchOptions: {
          args: [
            '--window-size=390,844',
            '--remote-debugging-port=9222'
          ]
        }
      },
    },
  ],

  // Configuration du serveur web
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
    stdout: 'pipe',
    stderr: 'pipe',
  },
});
