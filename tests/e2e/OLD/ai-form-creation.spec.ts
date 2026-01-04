/**
 * Test minimal : Création Form Poll via IA
 * Objectif : Vérifier que la création de questionnaire via IA fonctionne
 */

import { test, expect } from "@playwright/test";
import { setupGeminiMock } from "../global-setup";

test.describe("AI Form Poll Creation", () => {
  test.beforeEach(async ({ page }) => {
    // Setup mock Gemini
    await setupGeminiMock(page);

    // Clear localStorage pour éviter problèmes de quota
    await page.goto("/DooDates/");
    await page.evaluate(() => {
      localStorage.clear();
    });
    await page.reload();
  });

  test("should create a form poll via AI", async ({ page }) => {
    // 1. Aller sur la page d'accueil
    await page.goto("/DooDates/");
    console.log("✅ Page chargée");

    // 2. Attendre que le chat soit visible
    const chatInput = page.locator('[data-testid="message-input"]');
    await expect(chatInput).toBeVisible({ timeout: 10000 });
    console.log("✅ Chat input visible");

    // 3. Vérifier le quota IA (debug)
    const quotaInfo = await page.evaluate(() => {
      const quota = localStorage.getItem("ai-message-quota");
      return quota ? JSON.parse(quota) : null;
    });
    console.log("📊 Quota IA:", quotaInfo);

    // 4. Taper le message
    await chatInput.fill("Crée un questionnaire avec 3 questions");
    console.log("✅ Message tapé");

    // 5. Attendre un peu avant d'envoyer
    await page.waitForLoadState('domcontentloaded', { timeout: 2000 }).catch(() => {});

    // 6. Envoyer le message
    await chatInput.press("Enter");
    console.log("✅ Message envoyé");

    // 7. Attendre la réponse de Gemini (mock)
    await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});
    console.log("⏳ Attente réponse Gemini...");

    // 8. Vérifier que la réponse apparaît
    // Chercher le texte "Voici votre questionnaire" ou "Question 1"
    const responseVisible = await page
      .locator("text=/Voici votre questionnaire|Question 1/i")
      .isVisible()
      .catch(() => false);

    if (!responseVisible) {
      // Debug : Afficher le contenu de la page
      const pageContent = await page.textContent("body");
      console.log("❌ Réponse non visible. Contenu page:", pageContent?.substring(0, 500));

      // Vérifier les logs console du navigateur
      const consoleLogs = await page.evaluate(() => {
        return (window as any).__consoleLogs || [];
      });
      console.log("📝 Console logs:", consoleLogs);
    }

    expect(responseVisible).toBeTruthy();
    console.log("✅ Réponse Gemini visible");

    // 9. Cliquer sur "Créer ce formulaire"
    const createButton = page.getByRole("button", { name: /créer ce formulaire/i });
    await expect(createButton).toBeVisible({ timeout: 5000 });
    console.log('✅ Bouton "Créer ce formulaire" visible');

    await createButton.click();
    console.log("✅ Bouton cliqué");

    // 10. Vérifier que l'éditeur apparaît
    const editor = page.locator("[data-poll-preview]");
    await expect(editor).toBeVisible({ timeout: 10000 });
    console.log("✅ Éditeur visible");

    // 11. Vérifier que les questions sont présentes
    const questions = page.locator('[data-testid^="question-card"], [data-testid*="question"]');
    const count = await questions.count();
    expect(count).toBeGreaterThan(0);
    console.log(`✅ ${count} question(s) générée(s)`);

    console.log("🎉 TEST RÉUSSI !");
  });
});
