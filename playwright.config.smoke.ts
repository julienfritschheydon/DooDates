/**
 * Suite de Tests SMOKE - Tests critiques de production
 *
 * Objectif: Valider que l'application fonctionne en production
 * Durée: ~5 minutes
 * Navigateurs: Chromium uniquement
 *
 * Tests inclus:
 * - production-smoke.spec.ts (navigation de base)
 * - ultra-simple-poll.spec.ts (création sondage date)
 * - ultra-simple-dispo.spec.ts (availability poll)
 * - ultra-simple-quizz.spec.ts (quiz)
 */

import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  testMatch: [
    "production-smoke.spec.ts",
    "ultra-simple-poll.spec.ts",
    "ultra-simple-dispo.spec.ts",
    "ultra-simple-quizz.spec.ts",
  ],
  testIgnore: ["**/OLD/**", "**/products/**"],

  // Configuration optimisée pour les tests rapides
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,

  timeout: 30000, // 30s pour les tests rapides
  expect: {
    timeout: 10000,
  },

  reporter: [
    ["html", { outputFolder: "playwright-report-smoke" }],
    ["json", { outputFile: "test-results-smoke.json" }],
    ["list"],
  ],

  use: {
    baseURL: process.env.BASE_URL || "http://localhost:4173",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    actionTimeout: 8000, // Plus rapide pour les tests simples
    navigationTimeout: 10000,
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
