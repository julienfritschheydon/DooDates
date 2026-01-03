/**
 * Test dédié aux vrais appels Gemini API
 * 
 * CE TEST SEUL UTILISE LES VRAIS APPELS GEMINI
 * Tous les autres tests utilisent E2E_FORCE_MOCKS=true
 * 
 * Exécuter manuellement avec:
 * npm run test:gemini-real
 */

import { test, expect } from "@playwright/test";
import { setupTestEnvironment } from "./helpers/test-setup";

test.describe("Gemini API - Tests Réels", () => {
  test.beforeEach(async ({ page, browserName }) => {
    // NE PAS utiliser E2E_FORCE_MOCKS=true pour ce test
    await setupTestEnvironment(page, browserName, {
      clearLocalStorage: true,
      enableE2ELocalMode: true,
      warmup: true,
      consoleGuard: { enabled: true },
      navigation: { path: "/workspace", waitForReady: true },
      // NE PAS activer les mocks pour ce test
      mocks: { gemini: false },
    });
  });

  test("✅ Test connexion Gemini API réelle @real-gemini", async ({ page, browserName }, testInfo) => {
    console.log("🧪 Test Gemini API réelle - DÉBUT");
    
    // Ce test utilise les vrais appels Gemini
    // Il est le SEUL autorisé à consommer des crédits Gemini
    
    // Vérifier que la clé API est présente
    const geminiApiKey = process.env.VITE_GEMINI_API_KEY;
    if (!geminiApiKey || geminiApiKey === "fake-key-for-e2e-tests") {
      test.skip(true, "⚠️ VITE_GEMINI_API_KEY non configurée ou fake - test ignoré");
      return;
    }

    // Test simple : créer un sondage via IA
    await page.locator('[data-testid="chat-input"]').fill("Crée un sondage simple avec 2 dates pour tester Gemini");
    await page.locator('[data-testid="send-message"]').click();
    
    // Attendre la réponse Gemini (réelle, pas mockée)
    await expect(page.locator('[data-testid="ai-response"]')).toBeVisible({ timeout: 30000 });
    
    // Vérifier que la réponse contient des dates
    const aiResponse = await page.locator('[data-testid="ai-response"]').textContent();
    expect(aiResponse).toContain("sondage");
    
    console.log("✅ Test Gemini API réelle - RÉUSSI");
  });

  test("✅ Test quota tracking avec appel réel @real-gemini", async ({ page }) => {
    console.log("🧪 Test quota tracking avec appel réel");
    
    // Vérifier que la clé API est présente
    const geminiApiKey = process.env.VITE_GEMINI_API_KEY;
    if (!geminiApiKey || geminiApiKey === "fake-key-for-e2e-tests") {
      test.skip(true, "⚠️ VITE_GEMINI_API_KEY non configurée ou fake - test ignoré");
      return;
    }

    // Faire un appel réel et vérifier le quota
    await page.locator('[data-testid="chat-input"]').fill("Test quota tracking");
    await page.locator('[data-testid="send-message"]').click();
    
    // Attendre la réponse
    await expect(page.locator('[data-testid="ai-response"]')).toBeVisible({ timeout: 30000 });
    
    // Vérifier qu'il n'y a pas d'erreur de quota
    const noQuotaError = await page.locator('text=quota exceeded').isVisible({ timeout: 5000 }).catch(() => false);
    expect(noQuotaError).toBe(false);
    
    console.log("✅ Test quota tracking - RÉUSSI");
  });
});
