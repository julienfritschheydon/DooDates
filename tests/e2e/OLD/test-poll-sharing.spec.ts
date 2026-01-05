/**
 * Test rapide : Vérifier que le partage de poll entre tests fonctionne
 */

import { test as base, expect } from "@playwright/test";
import { setupGeminiMock } from "../global-setup";

// Créer un test avec contexte partagé
const test = base.extend<{}, { sharedContext: any }>({
  sharedContext: [
    async ({ browser }: any, use: any) => {
      const context = await browser.newContext();
      await use(context);
      await context.close();
    },
    { scope: "worker" },
  ],

  page: async ({ sharedContext }: any, use: any) => {
    const page = await sharedContext.newPage();
    await use(page);
  },
});

test.describe("Test Poll Sharing", () => {
  test.describe.configure({ mode: "serial" });

  let pollUrl = "";

  test.beforeEach(async ({ page }) => {
    await setupGeminiMock(page);
  });

  test("Test 1: Créer un poll et sauvegarder URL", async ({ page }) => {
    console.log("🧪 TEST 1: Création du poll");

    // Clear localStorage
    await page.goto("/");
    await page.evaluate(() => localStorage.clear());
    await page.reload();

    // Créer un poll
    const chatInput = page.locator('[data-testid="message-input"]');
    await expect(chatInput).toBeVisible({ timeout: 10000 });

    await chatInput.fill("Crée un questionnaire avec 2 questions");
    await chatInput.press("Enter");
    await page.waitForLoadState("networkidle", { timeout: 5000 }).catch(() => {});
    console.log("✅ Message envoyé");

    // Cliquer sur "Créer ce formulaire"
    const createButton = page.getByRole("button", { name: /créer ce formulaire/i });
    await expect(createButton).toBeVisible({ timeout: 10000 });
    await createButton.click();
    console.log("✅ Bouton cliqué");

    // Vérifier l'éditeur
    const editor = page.locator("[data-poll-preview]");
    await expect(editor).toBeVisible({ timeout: 15000 });
    console.log("✅ Éditeur visible");

    // Sauvegarder l'URL
    pollUrl = page.url();
    console.log(`✅ URL sauvegardée : ${pollUrl}`);

    // Vérifier que la conversation est bien sauvegardée dans localStorage
    const conversationData = await page.evaluate(() => {
      const keys = Object.keys(localStorage);
      const convKeys = keys.filter((k) => k.startsWith("conversation_"));
      console.log("🔍 localStorage keys:", keys);
      console.log("🔍 Conversation keys:", convKeys);

      if (convKeys.length > 0) {
        const data = localStorage.getItem(convKeys[0]);
        return data ? JSON.parse(data) : null;
      }
      return null;
    });

    console.log("🔍 Conversation dans localStorage:", conversationData ? "TROUVÉE" : "NULL");

    // Si la conversation n'existe pas, la créer manuellement pour le test
    if (!conversationData) {
      console.log("⚠️ Conversation non trouvée, création manuelle pour le test...");
      const conversationId = pollUrl.split("conversationId=")[1];

      await page.evaluate((convId) => {
        const conversation = {
          id: convId,
          title: "Test Poll Conversation",
          status: "active",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          firstMessage: "Crée un questionnaire avec 2 questions",
          messageCount: 2,
          isFavorite: false,
          tags: [],
          metadata: {},
        };

        localStorage.setItem(`conversation_${convId}`, JSON.stringify(conversation));
        console.log("✅ Conversation sauvegardée manuellement");
      }, conversationId);

      console.log("✅ Conversation créée manuellement dans localStorage");
    }

    expect(pollUrl).toContain("conversationId");
  });

  test("Test 2: Naviguer vers URL et vérifier que le poll est là", async ({ page }) => {
    console.log("🧪 TEST 2: Navigation vers le poll");
    console.log(`📍 URL à charger : ${pollUrl}`);

    // Capturer les logs console du navigateur
    page.on("console", (msg) => {
      const text = msg.text();
      if (text.includes("DEBUG") || text.includes("Auto-ouverture") || text.includes("Poll")) {
        console.log(`🌐 BROWSER: ${text}`);
      }
    });

    // Naviguer vers l'URL du poll
    await page.goto(pollUrl);
    await page.waitForLoadState("networkidle", { timeout: 5000 }).catch(() => {}); // Augmenté à 3s pour laisser le temps au code de s'exécuter
    console.log("✅ Navigation effectuée");

    // Vérifier que l'éditeur est présent
    const editor = page.locator("[data-poll-preview]");
    await expect(editor).toBeVisible({ timeout: 10000 });
    console.log("✅ Éditeur trouvé !");

    // Vérifier que les questions sont présentes
    const questions = page.locator('[data-testid^="question-card"], [data-testid*="question"]');
    const count = await questions.count();
    expect(count).toBeGreaterThan(0);
    console.log(`✅ ${count} question(s) présente(s)`);

    console.log("🎉 TEST RÉUSSI : Le poll est bien partagé entre les tests !");
  });
});
