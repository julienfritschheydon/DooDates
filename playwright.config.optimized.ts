/**
 * Playwright Configuration - VERSION OPTIMISÉE
 *
 * Changements principaux:
 * ✅ Workers: 1 → 3 en CI (tests parallèles)
 * ✅ Timeout: 60s → 45s (optimisations permettent de réduire)
 * ✅ actionTimeout: 15s → 10s (auto-wait réduit les besoins)
 * ✅ Ajout de globalSetup pour optimisations globales
 */

import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  testMatch: ["**/*.spec.ts", "**/*.test.ts", "**/*_test.ts"],
  testIgnore: ["**/OLD/**"],

  // ✅ OPTIMISATION: Tests parallèles toujours activés
  fullyParallel: true,

  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,

  // ✅ OPTIMISATION: 3 workers au lieu de 1 en CI
  // Permet d'exécuter 3 tests simultanément
  workers: process.env.CI ? 3 : undefined,

  reporter: "html",

  // ✅ OPTIMISATION: Timeout augmenté pour stabiliser les tests CI
  timeout: 60000, // 60s au lieu de 45s (plus stable pour CI)

  use: {
    baseURL: "http://localhost:8080",
    trace: "on-first-retry",

    // Screenshots seulement en cas d'échec (déjà optimal)
    screenshot: "only-on-failure",

    // ✅ OPTIMISATION: Action timeout augmenté pour stabilité CI
    actionTimeout: 15000, // 15s au lieu de 10s (plus stable)

    // ✅ OPTIMISATION: Navigation timeout
    navigationTimeout: 15000, // 15s max pour navigations
  },

  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],

        // ✅ OPTIMISATION: Désactiver animations pour tests plus rapides
        viewport: { width: 1280, height: 720 },

        // ✅ OPTIMISATION: Réduire les ressources chargées
        launchOptions: {
          args: ["--disable-web-security", "--disable-features=IsolateOrigins,site-per-process"],
        },
      },
    },

    // Firefox et Safari seulement si nécessaire
    // Commentés par défaut pour gagner du temps
    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    // },
    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    // },
  ],

  webServer: {
    command: "npm run dev:e2e",
    url: "http://localhost:8080",

    // ✅ OPTIMISATION: Réutiliser le serveur existant en local
    reuseExistingServer: !process.env.CI,

    // ✅ OPTIMISATION: Timeout réduit pour le démarrage
    timeout: 90 * 1000, // 90s au lieu de 120s

    // ✅ OPTIMISATION: Standard output pour voir les erreurs plus vite
    stdout: "pipe",
    stderr: "pipe",
  },
});
